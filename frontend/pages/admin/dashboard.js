import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import * as XLSX from 'xlsx'
import { apiFetch } from '../../lib/store'
import styles from '../../styles/Admin.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const CATEGORIES = ['fashion','food','beauty','lifestyle','health']
const CAT_LABEL  = { fashion:'패션', food:'식품', beauty:'뷰티', lifestyle:'라이프', health:'건강' }

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
    apiFetch(path, {
      ...options,
      headers: { Authorization: `Bearer ${token || localStorage.getItem('admin_token')}`, ...options.headers },
    })

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
      method: 'PATCH', body: JSON.stringify({ is_active: !is_active }),
    })
    loadData()
  }

  const updateOrderStatus = async (id, status) => {
    await authFetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    })
    loadData()
  }

  if (loading) return <div className={styles.loadingFull}>로딩 중...</div>

  return (
    <>
      <Head><title>관리자 대시보드 — FORMA</title></Head>
      <div className={styles.adminWrap}>

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLogo}>Forma</span>
          <nav className={styles.sidebarNav}>
            <button className={`${styles.navBtn} ${tab==='dashboard' ? styles.navActive : ''}`} onClick={()=>setTab('dashboard')}>대시보드</button>
            <button className={`${styles.navBtn} ${tab==='products'  ? styles.navActive : ''}`} onClick={()=>setTab('products')}>상품 관리</button>
            <button className={`${styles.navBtn} ${tab==='upload'    ? styles.navActive : ''}`} onClick={()=>setTab('upload')}>일괄 등록</button>
            <button className={`${styles.navBtn} ${tab==='orders'    ? styles.navActive : ''}`} onClick={()=>setTab('orders')}>주문 관리</button>
          </nav>
          <div style={{marginTop: 'auto', paddingTop: '24px'}}>
            <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className={styles.adminMain}>

          {/* 대시보드 */}
          {tab === 'dashboard' && (
            <div>
              <h2 className={styles.pageTitle}>대시보드</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}><p className={styles.statLabel}>전체 상품</p><p className={styles.statNum}>{stats.products||0}</p></div>
                <div className={styles.statCard}><p className={styles.statLabel}>전체 주문</p><p className={styles.statNum}>{stats.orders||0}</p></div>
                <div className={styles.statCard}><p className={styles.statLabel}>총 매출</p><p className={styles.statNum}>₩{(stats.revenue||0).toLocaleString()}</p></div>
              </div>
              <h3 className={styles.subTitle}>최근 주문</h3>
              <OrderTable orders={orders} onStatusChange={updateOrderStatus} />
            </div>
          )}

          {/* 상품 관리 */}
          {tab === 'products' && (
            <div>
              <div className={styles.tabHeader}>
                <h2 className={styles.pageTitle}>상품 관리</h2>
                <button className={styles.addBtn} onClick={()=>{setEditProduct(null);setShowForm(true)}}>+ 상품 등록</button>
              </div>
              {showForm && (
                <ProductForm
                  token={token}
                  product={editProduct}
                  onClose={()=>{setShowForm(false);setEditProduct(null)}}
                  onSave={()=>{setShowForm(false);setEditProduct(null);loadData()}}
                />
              )}
              <table className={styles.table}>
                <thead>
                  <tr><th>이미지</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>관리</th></tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.images?.[0]
                          ? <img src={p.images[0].url} alt={p.name} className={styles.thumbImg} />
                          : <div className={styles.thumbEmpty}>{p.emoji||'📦'}</div>}
                      </td>
                      <td className={styles.prodName}>{p.name}</td>
                      <td>{p.category_label||p.category}</td>
                      <td>₩{p.price.toLocaleString()}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span className={`${styles.badge} ${p.is_active?styles.badgeOn:styles.badgeOff}`}>
                          {p.is_active?'판매중':'숨김'}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <button className={styles.editBtn} onClick={()=>{setEditProduct(p);setShowForm(true)}}>수정</button>
                        <button className={styles.toggleBtn} onClick={()=>toggleActive(p.id,p.is_active)}>
                          {p.is_active?'숨기기':'활성화'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 일괄 등록 탭 ── */}
          {tab === 'upload' && (
            <BulkUpload token={token} onDone={loadData} />
          )}

          {/* 주문 관리 */}
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

/* ══════════════════════════════════════════════
   일괄 등록 컴포넌트
══════════════════════════════════════════════ */
function BulkUpload({ token, onDone }) {
  const [step, setStep]         = useState(1)   // 1:엑셀 2:이미지 3:결과
  const [products, setProducts] = useState([])
  const [imgFiles, setImgFiles] = useState({})  // { index: [File,...] }
  const [progress, setProgress] = useState({ current:0, total:0, label:'' })
  const [logs, setLogs]         = useState([])
  const [result, setResult]     = useState(null)
  const logRef = useRef(null)

  const addLog = (type, msg) => {
    setLogs(prev => [...prev, { type, msg }])
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50)
  }

  // ── 엑셀 파싱 ──
  const handleExcel = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const wb   = XLSX.read(e.target.result, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const parsed = rows.map((row, i) => ({
        index:       i,
        name:        String(row['상품명']||row['name']||'').trim(),
        price:       parseInt(row['가격']||row['price']||0),
        category:    mapCat(String(row['카테고리']||row['category']||'')),
        stock:       parseInt(row['재고']||row['stock']||0),
        description: String(row['설명']||row['description']||'').trim(),
        tag:         String(row['태그']||row['tag']||'').trim(),
        emoji:       String(row['이모지']||row['emoji']||'').trim(),
      })).filter(p => p.name && p.price)
      setProducts(parsed)
      setImgFiles({})
    }
    reader.readAsArrayBuffer(file)
  }

  const mapCat = (raw) => {
    const map = {
      '패션':'fashion','fashion':'fashion',
      '식품':'food','food':'food','푸드':'food',
      '뷰티':'beauty','beauty':'beauty',
      '라이프':'lifestyle','lifestyle':'lifestyle','라이프스타일':'lifestyle',
      '건강':'health','health':'health',
    }
    return map[raw] || map[raw.toLowerCase?.()] || 'fashion'
  }

  // ── 이미지 파일 세팅 ──
  const setImg = (pi, si, file) => {
    if (!file) return
    setImgFiles(prev => {
      const arr = [...(prev[pi]||[])]
      arr[si] = file
      return { ...prev, [pi]: arr }
    })
  }

  const removeImg = (pi, si) => {
    setImgFiles(prev => {
      const arr = [...(prev[pi]||[])]
      arr[si] = null
      return { ...prev, [pi]: arr }
    })
  }

  // ── 양식 다운로드 ──
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['상품명','가격','카테고리','재고','설명','태그','이모지'],
      ['코튼 오버핏 재킷',128000,'fashion',50,'상품 설명','NEW','🧥'],
      ['제주 말차 블렌드', 24000,'food',   80,'상품 설명','','🍵'],
    ])
    ws['!cols'] = [{wch:30},{wch:12},{wch:14},{wch:8},{wch:40},{wch:10},{wch:8}]

    const ws2 = XLSX.utils.aoa_to_sheet([
      ['카테고리 코드','한국어'],
      ['fashion','패션'],['food','식품'],['beauty','뷰티'],
      ['lifestyle','라이프스타일'],['health','건강'],
    ])
    XLSX.utils.book_append_sheet(wb, ws,  '상품목록')
    XLSX.utils.book_append_sheet(wb, ws2, '카테고리 가이드')
    XLSX.writeFile(wb, 'forma_상품등록_양식.xlsx')
  }

  // ── 등록 실행 ──
  const startUpload = async () => {
    setStep(3)
    setLogs([])
    setResult(null)
    let success = 0, failed = 0

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      setProgress({ current:i+1, total:products.length, label:`${p.name}` })
      addLog('info', `[${i+1}/${products.length}] ${p.name} 처리 중...`)

      try {
        // 1) 이미지 업로드
        const images = []
        const files  = (imgFiles[i]||[]).filter(Boolean)

        if (files.length) {
          const fd = new FormData()
          files.forEach(f => fd.append('images', f))
          const imgRes  = await fetch(`${API_BASE}/api/upload/images`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
          const imgData = await imgRes.json()
          if (imgData.images) images.push(...imgData.images.map(r=>({ url:r.url })))
          addLog('ok', `  ✓ 이미지 ${images.length}장 업로드`)
        }

        // 2) 상품 등록
        const res  = await fetch(`${API_BASE}/api/v1/products`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body: JSON.stringify({
            name:        p.name,
            price:       p.price,
            category:    p.category,
            stock:       p.stock,
            description: p.description||undefined,
            tag:         p.tag||undefined,
            emoji:       p.emoji||undefined,
            images,
          }),
        })
        const data = await res.json()
        if (res.ok) { addLog('ok', `  ✓ 등록 완료`); success++ }
        else        { addLog('err',`  ✗ 실패: ${data.error}`); failed++ }

      } catch (e) {
        addLog('err', `  ✗ 오류: ${e.message}`)
        failed++
      }
    }

    setResult({ success, failed })
    setProgress({ current:products.length, total:products.length, label:'완료!' })
    if (success > 0) onDone()
  }

  const pct = progress.total ? Math.round((progress.current/progress.total)*100) : 0

  return (
    <div>
      <div className={styles.tabHeader}>
        <h2 className={styles.pageTitle}>일괄 등록</h2>
        {step > 1 && step < 3 && (
          <button className={styles.cancelBtn} onClick={()=>setStep(1)}>← 이전</button>
        )}
      </div>

      {/* ── STEP 1: 엑셀 ── */}
      {step === 1 && (
        <div>
          {/* 양식 다운로드 */}
          <div className={styles.uploadBanner}>
            <div>
              <p style={{fontWeight:600,marginBottom:4}}>📋 엑셀 양식 다운로드</p>
              <p style={{fontSize:12,color:'var(--muted)'}}>양식에 맞게 상품 정보를 입력 후 업로드하세요</p>
            </div>
            <button className={styles.addBtn} onClick={downloadTemplate}>⬇ 양식 다운로드</button>
          </div>

          {/* 드롭존 */}
          <div
            className={styles.dropZone}
            onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add(styles.dropActive)}}
            onDragLeave={e=>e.currentTarget.classList.remove(styles.dropActive)}
            onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove(styles.dropActive);handleExcel(e.dataTransfer.files[0])}}
          >
            <input type="file" accept=".xlsx,.xls" onChange={e=>handleExcel(e.target.files[0])} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}} />
            <p style={{fontSize:32,marginBottom:8}}>📊</p>
            <p style={{fontSize:13,color:'var(--muted)'}}>엑셀 파일을 드래그하거나 <strong>클릭해서 선택</strong></p>
          </div>

          {/* 미리보기 */}
          {products.length > 0 && (
            <div style={{marginTop:24}}>
              <div className={styles.tabHeader} style={{marginBottom:12}}>
                <p style={{fontWeight:600}}>총 {products.length}개 상품</p>
                <button className={styles.addBtn} onClick={()=>setStep(2)}>다음: 이미지 연결 →</button>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>상품명</th><th>가격</th><th>카테고리</th><th>재고</th><th>태그</th></tr>
                </thead>
                <tbody>
                  {products.map((p,i)=>(
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{p.name}</td>
                      <td>₩{p.price.toLocaleString()}</td>
                      <td>
                        <select
                          value={p.category}
                          onChange={e=>setProducts(prev=>prev.map((x,xi)=>xi===i?{...x,category:e.target.value}:x))}
                          style={{padding:'3px 6px',border:'1px solid var(--border)',fontSize:12}}
                        >
                          {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                        </select>
                      </td>
                      <td>{p.stock}</td>
                      <td>{p.tag||'-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: 이미지 ── */}
      {step === 2 && (
        <div>
          <p style={{fontSize:13,color:'var(--muted)',marginBottom:24}}>
            각 상품에 이미지를 연결하세요. 이미지 없이도 등록 가능합니다. (상품당 최대 5장)
          </p>

          {products.map((p,pi)=>(
            <div key={pi} style={{marginBottom:28,paddingBottom:28,borderBottom:'1px solid var(--border)'}}>
              <p style={{fontWeight:600,marginBottom:2}}>{pi+1}. {p.name}</p>
              <p style={{fontSize:12,color:'var(--muted)',marginBottom:12}}>
                ₩{p.price.toLocaleString()} · {CAT_LABEL[p.category]}
              </p>
              <div className={styles.imgSlotGrid}>
                {[0,1,2,3,4].map(si=>{
                  const file = imgFiles[pi]?.[si]
                  const url  = file ? URL.createObjectURL(file) : null
                  return (
                    <div key={si} className={styles.imgSlot}>
                      {url ? (
                        <>
                          <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                          <button
                            className={styles.imgRemoveBtn}
                            onClick={()=>removeImg(pi,si)}
                          >×</button>
                        </>
                      ) : (
                        <>
                          <span style={{fontSize:20,color:'var(--muted)'}}>+</span>
                          <input
                            type="file" accept="image/*"
                            style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}
                            onChange={e=>setImg(pi,si,e.target.files[0])}
                          />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
            <button className={styles.addBtn} onClick={startUpload}>
              🚀 전체 등록하기 ({products.length}개)
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 진행/결과 ── */}
      {step === 3 && (
        <div>
          {/* 프로그레스 바 */}
          <div style={{marginBottom:20}}>
            <div style={{height:6,background:'var(--border)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
              <div style={{height:'100%',width:`${pct}%`,background:'var(--gold)',borderRadius:3,transition:'width .3s'}} />
            </div>
            <p style={{fontSize:12,color:'var(--muted)'}}>{progress.label} ({pct}%)</p>
          </div>

          {/* 로그 */}
          <div
            ref={logRef}
            style={{
              background:'#1a1a1a',color:'#e0e0e0',padding:16,
              fontFamily:'monospace',fontSize:11,lineHeight:1.8,
              maxHeight:240,overflowY:'auto',borderRadius:4,marginBottom:16,
            }}
          >
            {logs.map((l,i)=>(
              <div key={i} style={{color:l.type==='ok'?'#6dbf9e':l.type==='err'?'#e07070':'#e0c070'}}>
                {l.msg}
              </div>
            ))}
          </div>

          {/* 결과 */}
          {result && (
            <div style={{
              padding:'20px 24px',
              borderLeft:`3px solid ${result.failed===0?'var(--accent2)':'#e07070'}`,
              background:result.failed===0?'rgba(61,90,76,.06)':'rgba(192,57,43,.06)',
              marginBottom:16,
            }}>
              <p style={{fontWeight:600,marginBottom:4}}>
                {result.failed===0
                  ? `✅ ${result.success}개 상품 등록 완료!`
                  : `⚠️ ${result.success}개 성공 / ${result.failed}개 실패`}
              </p>
              {result.failed > 0 && (
                <p style={{fontSize:12,color:'var(--muted)'}}>로그에서 실패 항목을 확인하세요</p>
              )}
            </div>
          )}

          {result && (
            <div style={{display:'flex',gap:12}}>
              <button className={styles.cancelBtn} onClick={()=>{setStep(1);setProducts([]);setImgFiles({});setLogs([]);setResult(null)}}>
                + 다시 등록하기
              </button>
              <button className={styles.addBtn} onClick={()=>window.open('https://forma-store-phi.vercel.app','_blank')}>
                스토어에서 확인 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   주문 테이블
══════════════════════════════════════════════ */
function OrderTable({ orders, onStatusChange }) {
  const STATUS_OPTIONS = ['pending','paid','shipping','delivered','cancelled','refunded']
  const STATUS_LABEL   = { pending:'대기', paid:'결제완료', shipping:'배송중', delivered:'배송완료', cancelled:'취소', refunded:'환불' }
  if (!orders.length) return <p style={{color:'var(--muted)',fontSize:14}}>주문이 없습니다.</p>
  return (
    <table className={styles.table}>
      <thead>
        <tr><th>주문번호</th><th>금액</th><th>상태</th><th>날짜</th><th>변경</th></tr>
      </thead>
      <tbody>
        {orders.map(o=>(
          <tr key={o.id}>
            <td style={{fontSize:12,color:'var(--muted)'}}>{o.id.slice(0,8)}...</td>
            <td>₩{o.total.toLocaleString()}</td>
            <td><span className={styles.badge}>{STATUS_LABEL[o.status]||o.status}</span></td>
            <td style={{fontSize:12}}>{new Date(o.created_at).toLocaleDateString('ko-KR')}</td>
            <td>
              <select className={styles.statusSelect} value={o.status} onChange={e=>onStatusChange(o.id,e.target.value)}>
                {STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ══════════════════════════════════════════════
   상품 등록/수정 폼 (이미지 파일 업로드로 교체)
══════════════════════════════════════════════ */
function ProductForm({ token, product, onClose, onSave }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name:           product?.name||'',
    price:          product?.price||'',
    original_price: product?.original_price||'',
    category:       product?.category||'fashion',
    description:    product?.description||'',
    detail:         product?.detail||'',
    emoji:          product?.emoji||'',
    tag:            product?.tag||'',
    stock:          product?.stock||0,
    images:         product?.images||[],
  })
  const [imageFiles, setImageFiles] = useState([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleImageFiles = (files) => {
    const arr = Array.from(files).slice(0, 5 - form.images.length)
    setImageFiles(prev => [...prev, ...arr].slice(0,5))
  }

  const removeNewImg  = (i) => setImageFiles(prev=>prev.filter((_,xi)=>xi!==i))
  const removeOldImg  = (i) => set('images', form.images.filter((_,xi)=>xi!==i))

  const save = async () => {
    setSaving(true); setError('')
    try {
      // 1) 새 이미지 업로드
      let newImages = []
      if (imageFiles.length) {
        const fd = new FormData()
        imageFiles.forEach(f=>fd.append('images',f))
        const res  = await fetch(`${API_BASE}/api/upload/images`, {
          method:'POST', headers:{Authorization:`Bearer ${token}`}, body:fd,
        })
        const data = await res.json()
        newImages  = data.images?.map(r=>({url:r.url}))||[]
      }

      const body = {
        ...form,
        price:          Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : undefined,
        stock:          Number(form.stock),
        images:         [...form.images, ...newImages],
      }

      if (isEdit) {
        await fetch(`${API_BASE}/api/admin/products/${product.id}/update`, {
          method:'PUT',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
          body:JSON.stringify(body),
        })
      } else {
        await fetch(`${API_BASE}/api/v1/products`, {
          method:'POST',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
          body:JSON.stringify(body),
        })
      }
      onSave()
    } catch { setError('저장 중 오류가 발생했습니다') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formBox}>
        <div className={styles.formHeader}>
          <h3>{isEdit?'상품 수정':'상품 등록'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.formGrid}>
          <div className={styles.formFull}>
            <label>상품명 *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="상품명 입력" />
          </div>
          <div>
            <label>판매가 *</label>
            <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="29000" />
          </div>
          <div>
            <label>원가</label>
            <input type="number" value={form.original_price} onChange={e=>set('original_price',e.target.value)} placeholder="35000" />
          </div>
          <div>
            <label>카테고리 *</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label>재고</label>
            <input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} />
          </div>
          <div>
            <label>태그</label>
            <input value={form.tag} onChange={e=>set('tag',e.target.value)} placeholder="NEW / BEST / SALE" />
          </div>
          <div>
            <label>이모지</label>
            <input value={form.emoji} onChange={e=>set('emoji',e.target.value)} placeholder="👗" />
          </div>
          <div className={styles.formFull}>
            <label>간단 설명</label>
            <input value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
          <div className={styles.formFull}>
            <label>상세 설명</label>
            <textarea rows={4} value={form.detail} onChange={e=>set('detail',e.target.value)} />
          </div>

          {/* 이미지 업로드 */}
          <div className={styles.formFull}>
            <label>이미지 (최대 5장)</label>
            <div className={styles.imgSlotGrid} style={{marginTop:8}}>
              {/* 기존 이미지 */}
              {form.images.map((img,i)=>(
                <div key={`old-${i}`} className={styles.imgSlot}>
                  <img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <button className={styles.imgRemoveBtn} onClick={()=>removeOldImg(i)}>×</button>
                </div>
              ))}
              {/* 새 이미지 */}
              {imageFiles.map((f,i)=>(
                <div key={`new-${i}`} className={styles.imgSlot}>
                  <img src={URL.createObjectURL(f)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <button className={styles.imgRemoveBtn} onClick={()=>removeNewImg(i)}>×</button>
                </div>
              ))}
              {/* 추가 슬롯 */}
              {(form.images.length + imageFiles.length) < 5 && (
                <div className={styles.imgSlot} style={{position:'relative'}}>
                  <span style={{fontSize:20,color:'var(--muted)'}}>+</span>
                  <input
                    type="file" accept="image/*" multiple
                    style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}
                    onChange={e=>handleImageFiles(e.target.files)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving?'저장 중...':'저장'}
          </button>
        </div>
      </div>
    </div>
  )
}