/**
 * /api/upload — 이미지 업로드 (Cloudinary)
 *
 * POST /api/upload/image        단일 이미지
 * POST /api/upload/images       다중 이미지 (최대 5장)
 * DELETE /api/upload/image/:id  이미지 삭제
 */

const router     = require('express').Router()
const multer     = require('multer')
const cloudinary = require('cloudinary').v2
const { requireAdmin } = require('../middleware/auth')

// Cloudinary 설정 (환경변수에서 자동으로 읽음)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// multer — 메모리에 임시 저장 (디스크 X)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('JPG, PNG, WEBP, GIF만 업로드 가능합니다'))
    }
  },
})

// 버퍼를 Cloudinary에 업로드하는 헬퍼
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'forma-store/products',
        transformation: [
          { width: 1200, height: 1600, crop: 'limit' }, // 최대 사이즈 제한
          { quality: 'auto:good' },                      // 자동 품질 최적화
          { fetch_format: 'auto' },                      // webp 자동 변환
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    stream.end(buffer)
  })

// ── POST /api/upload/image — 단일 이미지 ──────────────
router.post('/image', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: '이미지 파일이 없습니다' })

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `product_${Date.now()}`,
    })

    res.json({
      success: true,
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
      format:    result.format,
      size:      result.bytes,
    })
  } catch (e) { next(e) }
})

// ── POST /api/upload/images — 다중 이미지 (최대 5장) ──
router.post('/images', requireAdmin, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: '이미지 파일이 없습니다' })

    const results = await Promise.all(
      req.files.map((file, i) =>
        uploadToCloudinary(file.buffer, {
          public_id: `product_${Date.now()}_${i}`,
        })
      )
    )

    res.json({
      success: true,
      count:   results.length,
      images:  results.map(r => ({
        url:       r.secure_url,
        public_id: r.public_id,
        width:     r.width,
        height:    r.height,
      })),
    })
  } catch (e) { next(e) }
})

// ── DELETE /api/upload/image/:id — 이미지 삭제 ────────
router.delete('/image/:id', requireAdmin, async (req, res, next) => {
  try {
    const publicId = decodeURIComponent(req.params.id)
    const result   = await cloudinary.uploader.destroy(publicId)

    if (result.result !== 'ok') {
      return res.status(404).json({ error: '이미지를 찾을 수 없습니다' })
    }
    res.json({ success: true, deleted: publicId })
  } catch (e) { next(e) }
})

module.exports = router
