import { useCartStore } from '../lib/store'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, count } = useCartStore()

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>장바구니 <span>{count}</span></h2>
          <button className={styles.close} onClick={closeCart}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>담긴 상품이 없습니다</p>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map(item => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemImg}>{item.emoji || '📦'}</div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemPrice}>₩{item.price.toLocaleString()}</p>
                    <div className={styles.qtyRow}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                  >✕</button>
                </li>
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>합계</span>
                <strong>₩{total.toLocaleString()}</strong>
              </div>
              <button className={styles.checkoutBtn}>
                결제하기 →
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
