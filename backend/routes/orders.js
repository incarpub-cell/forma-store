const router = require('express').Router()
const { z }  = require('zod')
const { query, transaction } = require('../db')
const { requireAuth } = require('../middleware/auth')
const { notifyWebhooks } = require('./webhooks')

const OrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    qty:        z.number().int().min(1),
  })).min(1),
  shipping_addr: z.object({
    name:    z.string(),
    phone:   z.string(),
    address: z.string(),
    zip:     z.string(),
  }),
  payment_method: z.string().default('card'),
  memo: z.string().optional(),
})

// POST /api/orders  — 주문 생성
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = OrderSchema.parse(req.body)

    const result = await transaction(async (client) => {
      // 상품 가격·재고 확인
      const ids = body.items.map(i => i.product_id)
      const { rows: prods } = await client.query(
        `SELECT id, name, price, stock, emoji FROM products
         WHERE id = ANY($1) AND is_active = TRUE`,
        [ids]
      )
      if (prods.length !== ids.length)
        throw Object.assign(new Error('일부 상품이 존재하지 않습니다'), { status: 400 })

      const prodMap = Object.fromEntries(prods.map(p => [p.id, p]))
      let total = 0
      const orderItems = body.items.map(i => {
        const p = prodMap[i.product_id]
        if (p.stock < i.qty) throw Object.assign(new Error(`${p.name} 재고 부족`), { status: 400 })
        total += p.price * i.qty
        return { product_id: i.product_id, name: p.name, emoji: p.emoji, price: p.price, qty: i.qty }
      })

      // 재고 차감
      for (const i of body.items) {
        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`, [i.qty, i.product_id]
        )
        await client.query(
          `INSERT INTO inventory_log (product_id, delta, reason, ref_id)
           VALUES ($1, $2, 'order', NULL)`, [i.product_id, -i.qty]
        )
      }

      // 주문 생성
      const { rows: [order] } = await client.query(`
        INSERT INTO orders (user_id, items, total, shipping_addr, payment_method, memo)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
      `, [req.user.id, JSON.stringify(orderItems), total,
          JSON.stringify(body.shipping_addr), body.payment_method, body.memo])

      return order
    })

    // Webhook 발송
    notifyWebhooks('order.created', result).catch(() => {})
    res.status(201).json(result)
  } catch (e) { next(e) }
})

// GET /api/orders  — 내 주문 목록
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (e) { next(e) }
})

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: '주문을 찾을 수 없습니다' })
    res.json(rows[0])
  } catch (e) { next(e) }
})

module.exports = router
