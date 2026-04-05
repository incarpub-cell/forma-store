import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { apiFetch } from '../../lib/store'
import ProductCard from '../../components/ProductCard'
import styles from '../../styles/Products.module.css'

const CATEGORIES = [
  { slug: '',          label: '전체' },
  { slug: 'fashion',   label: '패션' },
  { slug: 'food',      label: '식품' },
  { slug: 'beauty',    label: '뷰티' },
  { slug: 'lifestyle', label: '라이프' },
  { slug: 'health',    label: '건강' },
]
const SORTS = [
  { value: 'new',   label: '최신순' },
  { value: 'price_asc',  label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
]

export default function ProductsPage() {
  const router = useRouter()
  const { category = '', sort = 'new', q = '' } = router.query

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (sort)     params.set('sort', sort)
  if (q)        params.set('q', q)

  const { data, isLoading } = useSWR(`/api/products?${params}`, apiFetch)
  const products = data?.products || []

  const setFilter = (key, val) => {
    router.push({ pathname: '/products', query: { ...router.query, [key]: val } }, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>상품 — FORMA</title>
      </Head>

      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderInner}>
            <p className="eyebrow">Collection</p>
            <h1 className={styles.pageTitle}>
              {CATEGORIES.find(c => c.slug === category)?.label || '전체'} <em>상품</em>
            </h1>
          </div>
          {/* Search */}
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="상품 검색..."
              defaultValue={q}
              onKeyDown={e => e.key === 'Enter' && setFilter('q', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterBlock}>
              <p className={styles.filterTitle}>카테고리</p>
              {CATEGORIES.map(c => (
                <button
                  key={c.slug}
                  className={`${styles.filterBtn} ${category === c.slug ? styles.active : ''}`}
                  onClick={() => setFilter('category', c.slug)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className={styles.filterBlock}>
              <p className={styles.filterTitle}>정렬</p>
              {SORTS.map(s => (
                <button
                  key={s.value}
                  className={`${styles.filterBtn} ${sort === s.value ? styles.active : ''}`}
                  onClick={() => setFilter('sort', s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <main>
            <p className={styles.resultCount}>
              {isLoading ? '로딩 중...' : `${products.length}개 상품`}
            </p>
            <div className={styles.grid}>
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} delay={i * 0.05} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
