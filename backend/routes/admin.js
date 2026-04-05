const router = require('express').Router()
const { query } = require('../db')
const { requireAdmin } = require('../middleware/auth')

router.use(requireAdmin)

// GET /api/admin/dashboard  — 요약 통계
router.get('/dashboard', async (req, res, next) => {
  try {
    const [products, orders, revenue, recentOrders] = await Promise.all([
      query(`SELECT COUNT(*) FROM products WHERE is_active=TRUE`),
      query(`SELECT COUNT(*) FROM orders`),
      query(`SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status='paid'`),
      query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`),
    ])
    res.json({
      stats: {
        products:  Number(products.rows[0].count),
        orders:    Number(orders.rows[0].count),
        revenue:   Number(revenue.rows[0].total),
      },
      recentOrders: recentOrders.rows,
    })
  } catch (e) { next(e) }
})

// GET /api/admin/products  — 전체 상품 (비활성 포함)
router.get('/products', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const { rows } = await query(
      `SELECT p.*, c.label AS category_label
       FROM products p LEFT JOIN categories c ON c.slug = p.category
       ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    res.json({ products: rows })
  } catch (e) { next(e) }
})

// PATCH /api/admin/products/:id/status
router.patch('/products/:id/status', async (req, res, next) => {
  try {
    const { is_active } = req.body
    const { rows } = await query(
      `UPDATE products SET is_active=$1 WHERE id=$2 RETURNING id, name, is_active`,
      [is_active, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { next(e) }
})

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const allowed = ['pending','paid','shipping','delivered','cancelled','refunded']
    if (!allowed.includes(status)) return res.status(400).json({ error: '잘못된 상태값' })
    const { rows } = await query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { next(e) }
})

// GET /api/admin/api-keys  — API 키 목록
router.get('/api-keys', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, key_prefix, label, permissions, rate_limit, is_active, last_used, created_at
       FROM api_keys ORDER BY created_at DESC`
    )
    res.json({ keys: rows })
  } catch (e) { next(e) }
})

// DELETE /api/admin/api-keys/:id  — 키 비활성화
router.delete('/api-keys/:id', async (req, res, next) => {
  try {
    await query(`UPDATE api_keys SET is_active=FALSE WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (e) { next(e) }
})

module.exports = router
