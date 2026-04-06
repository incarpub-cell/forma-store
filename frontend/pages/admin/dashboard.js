import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { apiFetch } from '../../lib/store'
import styles from '../../styles/Admin.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin'); return }
    setToken(t)
    loadData(t)
  }, [])

  const authFetch = (path, options = {}) =>
    apiFetch(path, { ...options, headers: { Authorization: `Bearer ${token || localStorage.getItem('admin_token')}`, ...options.headers } })

  const loadData = async (t) => {
    const tk = t || token
    setLoading(true)
    try {
      const [prodData, dashData] = await Promise.all([
        apiFetch('/api/admin/products', { headers: { Authorization: `Bearer ${tk}` } }),
        apiFetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${tk}` } }),
      ])
      setProducts(prodData.products || [])
      setStats(dashData.stats || {})
      setOrders(dashData.recentOrders || [])
    } catch { router.push('/admin') }
    finally { setLoading(false) }
  }

  const logout = () => { localStorage.removeItem('admin_token'); router.push('/admin') }

  const toggleActive = async (id, is_active) => {
    await authFetch(`/api/admin/products/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ is_active: !is_active })
    })
    loadData()
  }

  const updateOrderStatus = async (id, status) => {
    await authFetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status })
    })
    loadData()
  }

  if (loading) return <div className={styles.loadingFull}>로딩 중...</div>

  return (
    <>
      <Head><title>관리자 대시보드 — FORMA</title></Head>
      <div className={styles.adminWrap}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLogo}>Forma</span>
          <nav className={styles.sidebarNav}>
            <button className={`${styles.navBtn} ${tab === 'dashboard' ? styles.navActive : ''}`} onClick={() => setTab('dashboard')}>대시보드</button>
            <button className={`${styles.navBtn} ${tab === 'products' ? styles.navActive : ''}`} onClick={() => setTab('products')}>상품 관리</button>
            <button className={`${styles.navBtn} ${tab === 'orders' ? styles.navActive : ''}`} onClick={() => setTab('orders')}>주문 관리</button>
          </nav>
          <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
        </aside>

        {/* Main */}
        <main className={styles.adminMain}>

          {/* ── 대시보드 ── */}
          {tab === 'dashboard' && (
            <div>
              <h2 className={styles.pageTitle}>대시보드</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>전체 상품</p>
                  <p className={styles.statNum}>{stats.products || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>전체 주문</p>
                  <p className={styles.statNum}>{stats.orders || 0}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>총 매출</p>
                  <p className={styles.statNum}>₩{(stats.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
              <h3 className={styles.subTitle}>최근 주문</h3>
              <OrderTable orders={orders} onStatusChange={updateOrderStatus} />
            </div>
          )}

          {/* ── 상품 관리 ── */}
          {tab === 'products' && (
            <div>
              <div className={styles.tabHeader}>
                <h2 className={styles.pageTitle}>상품 관리</h2>
                <button className={styles.addBtn} onClick={() => { setEditProduct(null); setShowForm(true) }}>+ 상품 등록</button>
              </div>

              {showForm && (
                <ProductForm
                  token={token}
                  product={editProduct}
                  onClose={() => { setShowForm(false); setEditProduct(null) }}
                  onSave={() => { setShowForm(false); setEditProduct(null); loadData() }}
                />
              )}

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>이미지</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th>가격</th>
                    <th>재고</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.images?.[0] ? (
                          <img src={p.images[0].url} alt={p.name} className={styles.thumbImg} />
                        ) : (
                          <div className={styles.thumbEmpty}>{p.emoji || '📦'}</div>
                        )}
                      </td>
                      <td className={styles.prodName}>{p.name}</td>
                      <td>{p.category_label || p.category}</td>
                      <td>₩{p.price.toLocaleString()}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span className={`${styles.badge} ${p.is_active ? styles.badgeOn : styles.badgeOff}`}>
                          {p.is_active ? '판매중' : '숨김'}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <button className={styles.editBtn} onClick={() => { setEditProduct(p); setShowForm(true) }}>수정</button>
                        <button className={styles.toggleBtn} onClick={() => toggleActive(p.id, p.is_active)}>
                          {p.is_active ? '숨기기' : '활성화'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 주문 관리 ── */}
          {tab === 'orders' && (
            <div>
              <h2 className={styles.pageTitle}>주문 관리</h2>
              <OrderTable orders={orders} onStatusChange={updateOrderStatus} />
            </div>
          )}
        </main>
      </div>
    </>
  )
}

// ── 주문 테이블 ────────────────────────────────────────────
function OrderTable({ orders, onStatusChange }) {
  const STATUS_OPTIONS = ['pending','paid','shipping','delivered','cancelled','refunded']
  const STATUS_LABEL = { pending:'대기', paid:'결제완료', shipping:'배송중', delivered:'배송완료', cancelled:'취소', refunded:'환불' }

  if (!orders.length) return <p style={{ color: 'var(--muted)', fontSize: 14 }}>주문이 없습니다.</p>

  return (
    <table className={styles.table}>
      <thead>
        <tr><th>주문번호</th><th>금액</th><th>상태</th><th>날짜</th><th>변경</th></tr>
      </thead>
      <tbody>
        {orders.map(o => (
          <tr key={o.id}>
            <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.id.slice(0,8)}...</td>
            <td>₩{o.total.toLocaleString()}</td>
            <td><span className={styles.badge}>{STATUS_LABEL[o.status] || o.status}</span></td>
            <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('ko-KR')}</td>
            <td>
              <select
                className={styles.statusSelect}
                value={o.status}
                onChange={e => onStatusChange(o.id, e.target.value)}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── 상품 등록/수정 폼 ──────────────────────────────────────
function ProductForm({ token, product, onClose, onSave }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name:          product?.name || '',
    price:         product?.price || '',
    original_price: product?.original_price || '',
    category:      product?.category || 'fashion',
    description:   product?.description || '',
    detail:        product?.detail || '',
    emoji:         product?.emoji || '',
    tag:           product?.tag || '',
    stock:         product?.stock || 0,
    images:        product?.images || [],
    detail_images: product?.detail_images || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // 이미지 URL 입력 핸들러
  const setImageUrl = (type, index, value) => {
    const arr = [...form[type]]
    arr[index] = { ...arr[index], url: value, alt: arr[index]?.alt || '' }
    set(type, arr)
  }
  const addImage    = (type) => set(type, [...form[type], { url: '', alt: '' }])
  const removeImage = (type, index) => set(type, form[type].filter((_, i) => i !== index))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const body = {
        ...form,
        price:          Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : undefined,
        stock:          Number(form.stock),
        images:         form.images.filter(i => i.url),
        detail_images:  form.detail_images.filter(i => i.url),
      }

      if (isEdit) {
        await fetch(`${apiKey}/api/admin/products/${product.id}/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
      } else {
        // 새 상품 등록은 admin API 키로 처리
        const keyRes = await fetch(`${apiKey}/api/v1/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('api_key') || ''}` },
          body: JSON.stringify(body),
        })
        if (!keyRes.ok) {
          setError('상품 등록에는 API 키가 필요합니다. 설정에서 API 키를 입력해주세요.')
          return
        }
      }
      onSave()
    } catch (e) {
      setError('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const CATEGORIES = ['fashion','food','beauty','lifestyle','health']
  const CAT_LABEL  = { fashion:'패션', food:'식품', beauty:'뷰티', lifestyle:'라이프', health:'건강' }

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formBox}>
        <div className={styles.formHeader}>
          <h3>{isEdit ? '상품 수정' : '상품 등록'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.formGrid}>
          {/* 기본 정보 */}
          <div className={styles.formFull}>
            <label>상품명 *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="상품명 입력" />
          </div>

          <div>
            <label>판매가 *</label>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="29000" />
          </div>

          <div>
            <label>원가 (할인 전 가격)</label>
            <input type="number" value={form.original_price} onChange={e => set('original_price', e.target.value)} placeholder="35000" />
          </div>

          <div>
            <label>카테고리 *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>

          <div>
            <label>재고</label>
            <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>

          <div>
            <label>태그 (NEW / BEST / SALE)</label>
            <input value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="NEW" />
          </div>

          <div>
            <label>이모지</label>
            <input value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="👗" />
          </div>

          <div className={styles.formFull}>
            <label>간단 설명</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="상품 목록에 표시될 짧은 설명" />
          </div>

          <div className={styles.formFull}>
            <label>상세 설명</label>
            <textarea rows={4} value={form.detail} onChange={e => set('detail', e.target.value)} placeholder="상세 페이지에 표시될 설명" />
          </div>

          {/* 대표 이미지 */}
          <div className={styles.formFull}>
            <label>대표 이미지 (최대 5장)</label>
            {form.images.map((img, i) => (
              <div key={i} className={styles.imgRow}>
                <input
                  value={img.url}
                  onChange={e => setImageUrl('images', i, e.target.value)}
                  placeholder="https://... 이미지 URL"
                />
                {img.url && <img src={img.url} alt="" className={styles.imgPreview} />}
                <button className={styles.removeImgBtn} onClick={() => removeImage('images', i)}>✕</button>
              </div>
            ))}
            {form.images.length < 5 && (
              <button className={styles.addImgBtn} onClick={() => addImage('images')}>+ 이미지 추가</button>
            )}
          </div>

          {/* 상세 이미지 */}
          <div className={styles.formFull}>
            <label>상세 이미지 (제한 없음)</label>
            {form.detail_images.map((img, i) => (
              <div key={i} className={styles.imgRow}>
                <input
                  value={img.url}
                  onChange={e => setImageUrl('detail_images', i, e.target.value)}
                  placeholder="https://... 이미지 URL"
                />
                {img.url && <img src={img.url} alt="" className={styles.imgPreview} />}
                <button className={styles.removeImgBtn} onClick={() => removeImage('detail_images', i)}>✕</button>
              </div>
            ))}
            <button className={styles.addImgBtn} onClick={() => addImage('detail_images')}>+ 이미지 추가</button>
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
