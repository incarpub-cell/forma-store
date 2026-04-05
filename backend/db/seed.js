require('dotenv').config()
const { query, pool } = require('./index')

const categories = [
  { slug: 'fashion',   label: '패션',    emoji: '👗', sort_order: 1 },
  { slug: 'food',      label: '식품',    emoji: '🍱', sort_order: 2 },
  { slug: 'beauty',    label: '뷰티',    emoji: '🌿', sort_order: 3 },
  { slug: 'lifestyle', label: '라이프',  emoji: '🏠', sort_order: 4 },
  { slug: 'health',    label: '건강',    emoji: '💊', sort_order: 5 },
]

const products = [
  { name: '코튼 오버핏 재킷',      category: 'fashion',   price: 128000, emoji: '🧥', tag: 'NEW',  stock: 50,
    description: '고급 코튼 소재의 루즈핏 재킷. 어떤 스타일에도 매치 가능.' },
  { name: '국산 유기농 된장 세트',  category: 'food',      price: 38000,  emoji: '🫙', tag: '유기농', stock: 120,
    description: '3년 숙성 전통 방식 된장. 산지 직송.' },
  { name: '소이 캔들 컬렉션',      category: 'lifestyle', price: 42000,  emoji: '🕯️', tag: null,   stock: 80,
    description: '100% 천연 소이 왁스, 은은한 향으로 공간을 채웁니다.' },
  { name: '녹차 수분 앰플',        category: 'beauty',    price: 56000,  emoji: '🌿', tag: 'BEST', stock: 200,
    description: '제주 녹차 추출물 함유 수분 집중 앰플.' },
  { name: '캔버스 로우 스니커즈',   category: 'fashion',   price: 89000,  emoji: '👟', tag: null,   stock: 65,
    description: '클래식한 캔버스 소재, 데일리로 신기 좋은 스니커즈.' },
  { name: '제주 말차 블렌드',       category: 'food',      price: 24000,  emoji: '🍵', tag: '제주산', stock: 300,
    description: '제주산 말차 100%. 깊고 진한 풍미.' },
  { name: '린넨 쿠션 커버 2P',     category: 'lifestyle', price: 35000,  emoji: '🛋️', tag: null,   stock: 90,
    description: '자연스러운 질감의 린넨 쿠션 커버 2장 세트.' },
  { name: '마그네슘 + 비타민D 세트', category: 'health',   price: 47000,  emoji: '💊', tag: 'SALE', stock: 150,
    description: '흡수율 높은 마그네슘 글리시네이트 + 비타민D3 세트.' },
]

async function seed() {
  // Categories
  for (const c of categories) {
    await query(`
      INSERT INTO categories (slug, label, emoji, sort_order)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (slug) DO NOTHING
    `, [c.slug, c.label, c.emoji, c.sort_order])
  }

  // Products
  for (const p of products) {
    await query(`
      INSERT INTO products (name, category, price, emoji, tag, stock, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT DO NOTHING
    `, [p.name, p.category, p.price, p.emoji, p.tag, p.stock, p.description])
  }

  console.log('✅ Seed complete')
  await pool.end()
}

seed().catch(e => { console.error(e); process.exit(1) })
