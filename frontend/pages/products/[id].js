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

  if (isLoading) return <div className={styles.loading}>로딩 중...</div>
  if (!product)  return <div className={styles.loading}>상품을 찾을 수 없습니다</div>

  return (
    <>
      <Head><title>{product.name} — FORMA</title></Head>
      <div className={styles.page}>
        {/* Image panel */}
        <div
          className={styles.imagePanel}
          style={{ background: product.images?.length ? '#F5F0E8' : BG_MAP[product.category] || BG_MAP.fashion }}
        >
          {product.images?.length ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
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
            <button
              className={styles.addToCart}
              onClick={() => addItem({ ...product, qty })}
            >
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
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)' }}>
                {product.detail || '상세 정보가 없습니다.'}
              </p>
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
