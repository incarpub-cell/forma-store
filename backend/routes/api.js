/**
 * /api/v1  — 파트너/외부 시스템용 REST API
 *
 * 모든 요청: Authorization: Bearer {API_KEY}
 *
 * 엔드포인트:
 *   POST   /api/v1/products           단건 등록
 *   POST   /api/v1/products/bulk      대량 등록 (최대 100건)
 *   PUT    /api/v1/products/:id       전체 수정
 *   PATCH  /api/v1/products/:id       부분 수정 (가격·재고 등)
 *   DELETE /api/v1/products/:id       삭제(비활성화)
 *   POST   /api/v1/inventory/sync     재고 일괄 동기화
 *   GET    /api/v1/products           목록 조회
 *   GET    /api/v1/products/:id       단건 조회
 *   GET    /api/v1/orders             주문 조회 (읽기 전용)
 *   POST   /api/v1/keys               API 키 발급 (admin only)
 */

const router   = require('express').Router()
const bcrypt   = require('bcryptjs')
const { v4: uuid } = require('uuid')
const { z }    = require('zod')
const rateLimit = require('express-rate-limit')
const { query, transaction } = require('../db')
const { requireApiKey, requireAdmin, requireAuth } = require('../middleware/auth')

// API Key별 Rate Limit
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: (req) => req.apiKey?.rate_limit || 100,
  keyGenerator: (req) => req.apiKey?.id || req.ip,
})

// 모든 /api/v1 엔드포인트에 API Key 인증 적용
router.use(requireApiKey, apiLimiter)

// ── Validation Schemas ─────────────────────────────────────
const ImageItem = z.object({ url: z.string().url(), alt: z.string().optional() })

const ProductSchema = z.object({
  name:           z.string().min(1).max(200),
  price:          z.number().int().min(0),
  category:       z.enum(['fashion','food','beauty','lifestyle','health']),
  description:    z.string().optional(),
  detail:         z.string().optional(),
  original_price: z.number().int().optional(),
  emoji:          z.string().optional(),
  tag:            z.string().max(40).optional(),
  stock:          z.number().int().min(0).default(0),
  images:         z.array(ImageItem).max(5).optional(),
  detail_images:  z.array(ImageItem).optional(),
  meta:           z.record(z.unknown()).optional(),
})

const PatchSchema = ProductSchema.partial()

// ── POST /api/v1/products  — 단건 등록 ────────────────────
router.post('/products', async (req, res, next) => {
  try {
    const body = ProductSchema.parse(req.body)
    const { rows: [product] } = await query(`
      INSERT INTO products
        (name, price, category, description, detail, original_price,
         emoji, tag, stock, images, detail_images, meta, source)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'api')
      RETURNING *
    `, [body.name, body.price, body.category, body.description,
        body.detail, body.original_price, body.emoji, body.tag,
        body.stock, JSON.stringify(body.images || []),
        JSON.stringify(body.detail_images || []),
        JSON.stringify(body.meta || {})])
    res.status(201).json({ success: true, product })
  } catch (e) { next(e) }
})

// ── POST /api/v1/products/bulk  — 대량 등록 ───────────────
router.post('/products/bulk', async (req, res, next) => {
  try {
    const items = z.array(ProductSchema).max(100).parse(req.body.products || req.body)
    const created = []
    const errors  = []

    for (let i = 0; i < items.length; i++) {
      try {
        const b = items[i]
        const { rows: [p] } = await query(`
          INSERT INTO products
            (name, price, category, description, original_price,
             emoji, tag, stock, images, meta, source)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'api')
          RETURNING id, name, price, category
        `, [b.name, b.price, b.category, b.description,
            b.original_price, b.emoji, b.tag, b.stock,
            JSON.stringify(b.images || []), JSON.stringify(b.meta || {})])
        created.push(p)
      } catch (e) {
        errors.push({ index: i, error: e.message })
      }
    }
    res.status(207).json({
      success: errors.length === 0,
      created: created.length,
      errors:  errors.length,
      results: { created, errors },
    })
  } catch (e) { next(e) }
})

// ── PUT /api/v1/products/:id  — 전체 수정 ─────────────────
router.put('/products/:id', async (req, res, next) => {
  try {
    const body = ProductSchema.parse(req.body)
    const { rows } = await query(`
      UPDATE products SET
        name=$1, price=$2, category=$3, description=$4, original_price=$5,
        emoji=$6, tag=$7, stock=$8, images=$9, meta=$10
      WHERE id=$11 AND is_active=TRUE
      RETURNING *
    `, [body.name, body.price, body.category, body.description,
        body.original_price, body.emoji, body.tag, body.stock,
        JSON.stringify(body.images||[]), JSON.stringify(body.meta||{}),
        req.params.id])
    if (!rows.length) return res.status(404).json({ error: '상품 없음' })
    res.json({ success: true, product: rows[0] })
  } catch (e) { next(e) }
})

// ── PATCH /api/v1/products/:id  — 부분 수정 ───────────────
router.patch('/products/:id', async (req, res, next) => {
  try {
    const body = PatchSchema.parse(req.body)
    const fields = Object.keys(body)
    if (!fields.length) return res.status(400).json({ error: '수정할 필드가 없습니다' })

    const sets   = fields.map((f, i) => `${f}=$${i + 2}`)
    const values = fields.map(f => {
      if (f === 'images')        return JSON.stringify(body[f])
      if (f === 'detail_images') return JSON.stringify(body[f])
      if (f === 'meta')          return JSON.stringify(body[f])
      return body[f]
    })
    const { rows } = await query(
      `UPDATE products SET ${sets.join(',')} WHERE id=$1 AND is_active=TRUE RETURNING *`,
      [req.params.id, ...values]
    )
    if (!rows.length) return res.status(404).json({ error: '상품 없음' })
    res.json({ success: true, product: rows[0] })
  } catch (e) { next(e) }
})

// ── DELETE /api/v1/products/:id  — 비활성화 ───────────────
router.delete('/products/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `UPDATE products SET is_active=FALSE WHERE id=$1`, [req.params.id]
    )
    if (!rowCount) return res.status(404).json({ error: '상품 없음' })
    res.json({ success: true })
  } catch (e) { next(e) }
})

// ── POST /api/v1/inventory/sync  — 재고 일괄 동기화 ───────
router.post('/inventory/sync', async (req, res, next) => {
  try {
    const items = z.array(z.object({
      product_id: z.string().uuid(),
      stock:      z.number().int().min(0),
    })).parse(req.body.items || req.body)

    const updated = []
    for (const item of items) {
      const { rows } = await query(
        `UPDATE products SET stock=$1 WHERE id=$2 AND is_active=TRUE RETURNING id, name, stock`,
        [item.stock, item.product_id]
      )
      if (rows.length) {
        updated.push(rows[0])
        await query(
          `INSERT INTO inventory_log (product_id, delta, reason) VALUES ($1,$2,'api_sync')`,
          [item.product_id, item.stock]
        )
      }
    }
    res.json({ success: true, updated: updated.length, products: updated })
  } catch (e) { next(e) }
})

// ── GET /api/v1/products  — 조회 ──────────────────────────
router.get('/products', async (req, res, next) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query
    const params = []
    let where = 'is_active = TRUE'
    if (category) { params.push(category); where += ` AND category = $${params.length}` }
    params.push(Number(limit), Number(offset))
    const { rows } = await query(
      `SELECT * FROM products WHERE ${where} ORDER BY created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    )
    res.json({ products: rows, count: rows.length })
  } catch (e) { next(e) }
})

// ── GET /api/v1/products/:id ───────────────────────────────
router.get('/products/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM products WHERE id=$1`, [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: '상품 없음' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

// ── GET /api/v1/orders  — 주문 조회 ───────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    const params = [Number(limit), Number(offset)]
    let where = ''
    if (status) { params.unshift(status); where = `WHERE status=$1` }
    const idx = params.length
    const { rows } = await query(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${idx-1} OFFSET $${idx}`,
      params
    )
    res.json({ orders: rows })
  } catch (e) { next(e) }
})

module.exports = router

module.exports = router
