import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useState } from 'react'
import { apiFetch, useCartStore } from '../../lib/store'
import styles from '../../styles/ProductDetail.module.css'

const BG_MAP = {
  fashion:   'linear-gradient(145deg,#F0E8DC,#E0D4C4)',
  food:      'linear-gradient(145deg,#D8E4DC,#C4D8CC)',
  beauty:    'linear-gradient(145deg,#E4D8D0,#D4C4BC)',
  lifestyle: 'linear-gradient(145deg,#E8E0CC,#D8D0BC)',
  health:    'linear-gradient(145deg,#DCDCE8,#CCCCE0)',
}

export default function ProductDetail() {
  const { query } = useRouter()
  const { data: product, isLoading } = useSWR(
    query.id ? `/api/products/${query.id}` : null,
    apiFetch
  )
  const addItem = useCartStore(s => s.addItem)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('detail')
  const [activeImg, setActiveImg] = useState(0)

  if (isLoading) return <div className={styles.loading}>로딩 중...</div>
  if (!product)  return <div className={styles.loading}>상품을 찾을 수 없습니다</div>

  const images = product.images || []

  return (
    <>
      <Head><title>{product.name} — FORMA</title></Head>
      <div className={styles.page}>
        {/* Image panel */}
        <div className={styles.imagePanel}
          style={{ background: images.length ? '#F5F0E8' : BG_MAP[product.category] || BG_MAP.fashion }}
        >
          {images.length ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* 메인 이미지 */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <img
                  src={images[activeImg].url}
                  alt={images[activeImg].alt || product.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              {/* 썸네일 */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, padding: '0 24px 24px', overflowX: 'auto' }}>
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: 64, height: 64, flexShrink: 0,
                        border: i === activeImg ? '2px solid #1A1814' : '2px solid transparent',
                        cursor: 'pointer', overflow: 'hidden', background: '#EDE8E0',
                      }}
                    >
                      <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className={styles.productEmoji}>{product.emoji || '📦'}</span>
          )}
          {product.tag && <span className={styles.badgeFloat}>{product.tag}</span>}
        </div>

        {/* Info panel */}
        <div className={styles.infoPanel}>
          <p className={styles.breadcrumb}>
            홈 / {product.category_label} / <span>{product.name}</span>
          </p>

          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.productPrice}>₩{product.price.toLocaleString()}</p>

          {product.description && (
            <p className={styles.productDesc}>{product.description}</p>
          )}

          {/* Qty selector */}
          <div className={styles.qtyRow}>
            <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className={styles.qtyVal}>{qty}</span>
            <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          <div className={styles.actions}>
            <button className={styles.addToCart} onClick={() => addItem({ ...product, qty })}>
              장바구니 담기
            </button>
            <button className={styles.buyNow}>바로 구매</button>
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span>재고</span>
              <span>{product.stock > 0 ? `${product.stock}개 남음` : '품절'}</span>
            </div>
            <div className={styles.metaRow}>
              <span>배송</span>
              <span>오늘 주문 시 내일 도착</span>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {['detail', 'review', 'shipping'].map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
                onClick={() => setTab(t)}
              >
                {{ detail: '상세정보', review: '리뷰', shipping: '배송/반품' }[t]}
              </button>
            ))}
          </div>
          <div className={styles.tabContent}>
            {tab === 'detail' && (
              <div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)', marginBottom: 24 }}>
                  {product.detail || '상세 정보가 없습니다.'}
                </p>
                {product.detail_images?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {product.detail_images.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={img.alt || `상세이미지${i+1}`}
                        style={{ width: '100%', display: 'block' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'review' && <p style={{ color: 'var(--muted)', fontSize: 14 }}>아직 리뷰가 없습니다.</p>}
            {tab === 'shipping' && (
              <ul style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 2, listStyle: 'none' }}>
                <li>📦 무료 배송 (3만원 이상)</li>
                <li>🔄 7일 이내 무료 반품</li>
                <li>📞 고객센터: 1588-0000</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
