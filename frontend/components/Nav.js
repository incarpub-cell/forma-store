import Link from 'next/link'
import { useCartStore } from '../lib/store'
import styles from './Nav.module.css'

const LINKS = [
  { label: '새 컬렉션', href: '/products?sort=new' },
  { label: '패션',      href: '/products?category=fashion' },
  { label: '푸드',      href: '/products?category=food' },
  { label: '라이프',    href: '/products?category=lifestyle' },
  { label: '건강',      href: '/products?category=health' },
]

export default function Nav() {
  const { count, openCart } = useCartStore()

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>Forma</Link>

      <ul className={styles.links}>
        {LINKS.map(l => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>

      <div className={styles.right}>
        <button className={styles.cartBtn} onClick={openCart}>
          장바구니 {count > 0 && <span className={styles.badge}>{count}</span>}
        </button>
      </div>
    </nav>
  )
}
