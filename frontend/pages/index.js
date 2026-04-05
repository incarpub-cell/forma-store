import Head from 'next/head'
import Link from 'next/link'
import useSWR from 'swr'
import { apiFetch } from '../lib/store'
import ProductCard from '../components/ProductCard'
import styles from '../styles/Home.module.css'

const CATEGORIES = [
  { slug: 'fashion',   label: '패션',    emoji: '👗' },
  { slug: 'food',      label: '식품',    emoji: '🍱' },
  { slug: 'beauty',    label: '뷰티',    emoji: '🌿' },
  { slug: 'lifestyle', label: '라이프',  emoji: '🏠' },
  { slug: 'health',    label: '건강',    emoji: '💊' },
]

const MARQUEE_ITEMS = ['패션 & 의류','프리미엄 식품','라이프스타일','건강 & 웰니스','홈 & 인테리어']

export default function Home({ initialProducts }) {
  const { data } = useSWR('/api/products?limit=8', apiFetch, {
    fallbackData: initialProducts,
  })
  const products = data?.products || []

  return (
    <>
      <Head>
        <title>FORMA — 라이프스타일 스토어</title>
        <meta name="description" content="일상을 다시 디자인하는 프리미엄 라이프스타일 스토어" />
      </Head>

      {/* ── HERO ───────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={`${styles.eyebrow} eyebrow`}>2025 SS Collection</p>
          <h1 className={`${styles.heroTitle} display-title`}>
            일상을<br />
            <em>다시</em><br />
            디자인하다
          </h1>
          <p className={styles.heroSub}>
            스마트스토어와는 다릅니다. 브랜드의 철학을 담은 공간,
            제품이 아닌 경험을 파는 스토어.
          </p>
          <div className={styles.heroCta}>
            <Link href="/products" className={styles.btnPrimary}>컬렉션 보기</Link>
            <Link href="/about"    className={styles.btnGhost}>브랜드 스토리</Link>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroShape}>
            <span style={{ fontSize: 100, opacity: .3 }}>🏺</span>
          </div>
          <span className={styles.heroLabel}>SS — 2025</span>
          <span className={styles.heroCounter}>01</span>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────── */}
      <div className={styles.marqueeWrap}>
        <div className={styles.marqueeInner}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span key={i} className={styles.marqueeItem}>{t}
              <span className={styles.marqueeDot} />
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHeader} reveal`}>
          <div>
            <p className={styles.sectionNum}>00</p>
            <h2 className={styles.sectionTitle}>카테고리 <em>탐색</em></h2>
          </div>
        </div>
        <div className={styles.categoryStrip}>
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className={`${styles.catItem} reveal`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span className={styles.catEmoji}>{c.emoji}</span>
              <span className={styles.catName}>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ───────────────────────────────── */}
      <section className={styles.section} id="products">
        <div className={`${styles.sectionHeader} reveal`}>
          <div>
            <p className={styles.sectionNum}>01</p>
            <h2 className={styles.sectionTitle}>신상품 <em>컬렉션</em></h2>
          </div>
          <Link href="/products" className={styles.seeAll}>전체 보기 →</Link>
        </div>
        <div className={styles.productGrid}>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 0.07} />
          ))}
        </div>
      </section>

      {/* ── EDITORIAL ──────────────────────────────── */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={`${styles.editorialGrid} reveal`}>
          <div className={styles.editorialMain}>
            <span className={styles.editorialBigNum}>SS</span>
            <p className={styles.editorialTag}>브랜드 스토리</p>
            <h2 className={styles.editorialTitle}>
              좋은 것들은<br /><em>오래</em> 머문다
            </h2>
            <p className={styles.editorialDesc}>
              가치 있는 것들로만 큐레이션합니다. 불필요한 것을 걷어내고,
              진짜 필요한 것들만 남긴 공간.
            </p>
            <Link href="/about" className={styles.btnPrimary}>스토리 읽기</Link>
          </div>
          <div className={styles.editorialSide}>
            <Link href="/products?category=food" className={`${styles.editorialSmall} ${styles.es1}`}>
              <span className={styles.esEmoji}>🌾</span>
              <p className={styles.esLabel}>식품 큐레이션</p>
              <p className={styles.esTitle}>산지 직송<br />프리미엄 식재료</p>
              <span className={styles.esArrow}>→</span>
            </Link>
            <Link href="/products?tag=sale" className={`${styles.editorialSmall} ${styles.es2}`}>
              <span className={styles.esEmoji}>✨</span>
              <p className={styles.esLabel}>시즌 특가</p>
              <p className={styles.esTitle}>여름 필수템<br />최대 30% 할인</p>
              <span className={styles.esArrow}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className={styles.footer}>
        <div>
          <span className={styles.footerLogo}>Forma</span>
          <p className={styles.footerDesc}>일상의 것들을 다시 디자인합니다.<br />가치 있는 것들만 모았습니다.</p>
          <p style={{ fontSize: 11, letterSpacing: '.05em', color: 'rgba(255,255,255,.2)' }}>
            © 2025 Forma Store. All rights reserved.
          </p>
        </div>
        {[
          { head: '카테고리', links: CATEGORIES.map(c => ({ label: c.label, href: `/products?category=${c.slug}` })) },
          { head: '고객센터', links: [
            { label: '공지사항', href: '/notice' },
            { label: '자주 묻는 질문', href: '/faq' },
            { label: '교환 & 반품', href: '/returns' },
            { label: '배송 안내', href: '/shipping' },
          ]},
          { head: '파트너', links: [
            { label: 'API 문서', href: '/api-docs' },
            { label: '입점 문의', href: '/partner' },
            { label: 'SDK 다운로드', href: '/sdk' },
          ]},
        ].map(col => (
          <div key={col.head}>
            <p className={styles.footerHead}>{col.head}</p>
            <ul className={styles.footerLinks}>
              {col.links.map(l => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </footer>
      <div className={styles.footerBottom}>
        <span>FORMA — LIFESTYLE STORE</span>
        <span>개인정보처리방침 · 이용약관</span>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  try {
    const data = await apiFetch('/api/products?limit=8')
    return { props: { initialProducts: data } }
  } catch {
    return { props: { initialProducts: { products: [] } } }
  }
}
