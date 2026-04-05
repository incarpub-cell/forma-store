const router = require('express').Router()
const crypto = require('crypto')
const { query } = require('../db')

// Webhook 발송 유틸 (다른 라우터에서 import해서 사용)
async function notifyWebhooks(event, payload) {
  try {
    const { rows } = await query(
      `SELECT * FROM webhooks WHERE is_active=TRUE AND events @> $1`,
      [JSON.stringify([event])]
    )
    const body = JSON.stringify({ event, data: payload, ts: Date.now() })

    for (const wh of rows) {
      const sig = wh.secret
        ? crypto.createHmac('sha256', wh.secret).update(body).digest('hex')
        : null
      fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sig ? { 'X-Forma-Signature': sig } : {}),
        },
        body,
      }).catch(() => {}) // fire & forget
    }
  } catch (e) {
    console.error('Webhook dispatch error', e)
  }
}

// POST /api/webhooks  — 웹훅 등록
const { requireAdmin } = require('../middleware/auth')

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { url, events = ['order.created'], secret } = req.body
    const { rows: [wh] } = await query(`
      INSERT INTO webhooks (url, events, secret)
      VALUES ($1,$2,$3) RETURNING id, url, events, is_active, created_at
    `, [url, JSON.stringify(events), secret])
    res.status(201).json(wh)
  } catch (e) { next(e) }
})

// GET /api/webhooks
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT id, url, events, is_active, created_at FROM webhooks`)
    res.json({ webhooks: rows })
  } catch (e) { next(e) }
})

module.exports = router
module.exports.notifyWebhooks = notifyWebhooks
