import Link from 'next/link'
import { useCartStore } from '../lib/store'
import styles from './ProductCard.module.css'

const BG_MAP = {
  fashion:   'linear-gradient(145deg,#F0E8DC,#E0D4C4)',
  food:      'linear-gradient(145deg,#D8E4DC,#C4D8CC)',
  beauty:    'linear-gradient(145deg,#E4D8D0,#D4C4BC)',
  lifestyle: 'linear-gradient(145deg,#E8E0CC,#D8D0BC)',
  health:    'linear-gradient(145deg,#DCDCE8,#CCCCE0)',
}

export default function ProductCard({ product, delay = 0 }) {
  const addItem = useCartStore(s => s.addItem)
  const bg = BG_MAP[product.category] || BG_MAP.fashion

  return (
    <div
      className={`${styles.card} reveal`}
      style={{ transitionDelay: `${delay}s` }}
      data-cursor
    >
      <Link href={`/products/${product.id}`}>
        <div className={styles.imgWrap}>
          <div className={styles.img} style={{ background: bg }}>
            <span className={styles.emoji}>{product.emoji || '📦'}</span>
          </div>
          <div className={styles.overlay}>
            <button
              className={styles.quickAdd}
              onClick={e => { e.preventDefault(); addItem(product) }}
            >
              빠른 담기
            </button>
          </div>
        </div>
      </Link>

      <div className={styles.info}>
        <p className={styles.category}>{product.category_label || product.category}</p>
        <p className={styles.name}>{product.name}</p>
        <div className={styles.priceRow}>
          <span className={styles.price}>₩{product.price.toLocaleString()}</span>
          {product.tag && (
            <span className={`${styles.tag} ${product.tag === '유기농' || product.tag === '제주산' ? styles.green : ''}`}>
              {product.tag}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
