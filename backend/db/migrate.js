// db/migrate.js  — PostgreSQL 스키마 전체 생성
require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SQL = `
-- ─── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  slug       VARCHAR(60)  UNIQUE NOT NULL,
  label      VARCHAR(100) NOT NULL,
  emoji      VARCHAR(10),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(200) NOT NULL,
  slug           VARCHAR(220) UNIQUE,
  description    TEXT,
  detail         TEXT,
  price          INT  NOT NULL CHECK (price >= 0),
  original_price INT,
  category       VARCHAR(60) REFERENCES categories(slug),
  emoji          VARCHAR(20),
  tag            VARCHAR(40),          -- NEW, BEST, SALE, 유기농 ...
  stock          INT NOT NULL DEFAULT 0,
  images         JSONB DEFAULT '[]',   -- [{ url, alt }]
  meta           JSONB DEFAULT '{}',   -- 자유 필드 (무게, 사이즈 등)
  is_active      BOOLEAN DEFAULT TRUE,
  source         VARCHAR(60) DEFAULT 'manual', -- manual | api | zapier
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created   ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_fts       ON products
  USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description,'')));

-- ─── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  name          VARCHAR(100),
  phone         VARCHAR(30),
  role          VARCHAR(20) DEFAULT 'customer',  -- customer | admin
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  status          VARCHAR(30) DEFAULT 'pending',
  -- pending | paid | shipping | delivered | cancelled | refunded
  items           JSONB NOT NULL,   -- [{ product_id, name, price, qty }]
  total           INT  NOT NULL,
  shipping_addr   JSONB,
  payment_method  VARCHAR(40),
  payment_id      VARCHAR(200),     -- PG 거래번호
  memo            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ─── API Keys (파트너/외부 자동업로드용) ───────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash    VARCHAR(200) UNIQUE NOT NULL, -- bcrypt hash of actual key
  key_prefix  VARCHAR(12) NOT NULL,         -- 식별용 prefix (sk-live-xxxx)
  label       VARCHAR(100),                 -- "공급사A", "ERP연동"
  permissions JSONB DEFAULT '["products:write"]',
  rate_limit  INT DEFAULT 100,              -- req/min
  is_active   BOOLEAN DEFAULT TRUE,
  last_used   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Inventory Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_log (
  id         SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  delta      INT NOT NULL,      -- +입고 / -출고
  reason     VARCHAR(80),       -- order | api_sync | manual | return
  ref_id     VARCHAR(100),      -- order_id 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Webhooks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url        VARCHAR(500) NOT NULL,
  events     JSONB DEFAULT '["order.created"]',
  secret     VARCHAR(200),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── auto-update updated_at ───────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(SQL)
    console.log('✅ Migration complete')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(e => { console.error(e); process.exit(1) })
