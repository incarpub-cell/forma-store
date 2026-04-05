const router = require('express').Router()
const { query } = require('../db')

// GET /api/products  — 목록 (카테고리·검색·정렬 필터)
router.get('/', async (req, res, next) => {
  try {
    const { category, sort = 'new', q, tag, limit = 20, offset = 0 } = req.query
    const params = []
    const conditions = ['p.is_active = TRUE']

    if (category) { params.push(category);          conditions.push(`p.category = $${params.length}`) }
    if (tag)      { params.push(tag);               conditions.push(`p.tag = $${params.length}`) }
    if (q) {
      params.push(q)
      conditions.push(`to_tsvector('simple', p.name || ' ' || COALESCE(p.description,''))
                       @@ plainto_tsquery('simple', $${params.length})`)
    }

    const orderMap = {
      new:        'p.created_at DESC',
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
    }
    const orderBy = orderMap[sort] || orderMap.new

    params.push(Number(limit), Number(offset))
    const sql = `
      SELECT p.*, c.label AS category_label
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `
    const { rows } = await query(sql, params)

    // total count
    const countSql = `SELECT COUNT(*) FROM products p WHERE ${conditions.slice(0, -2).join(' AND ') || 'p.is_active = TRUE'}`
    // simple total
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM products p WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    )

    res.json({ products: rows, total: Number(countRows[0].count) })
  } catch (e) { next(e) }
})

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.*, c.label AS category_label
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category
      WHERE p.id = $1 AND p.is_active = TRUE
    `, [req.params.id])
    if (!rows.length) return res.status(404).json({ error: '상품을 찾을 수 없습니다' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

module.exports = router
