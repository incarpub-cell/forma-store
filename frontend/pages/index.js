import Head from 'next/head'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/store'

export default function Home() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    apiFetch('/api/products?limit=8').then(d => setProducts(d.products || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const cur = document.getElementById('cursor')
    const ring = document.getElementById('ring')
    if (!cur || !ring) return
    let mx=0,my=0,rx=0,ry=0,raf
    const onMove = e => { mx=e.clientX; my=e.clientY; cur.style.left=mx+'px'; cur.style.top=my+'px' }
    const animate = () => { rx+=(mx-rx)*.1; ry+=(my-ry)*.1; ring.style.left=rx+'px'; ring.style.top=ry+'px'; raf=requestAnimationFrame(animate) }
    animate()
    window.addEventListener('mousemove', onMove)
    const addBig = () => { cur.classList.add('big'); ring.classList.add('big') }
    const remBig = () => { cur.classList.remove('big'); ring.classList.remove('big') }
    document.querySelectorAll('a,button,.product-card').forEach(el => {
      el.addEventListener('mouseenter', addBig)
      el.addEventListener('mouseleave', remBig)
    })
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [products])

  useEffect(() => {
    const nav = document.getElementById('nav')
    if (!nav) return
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: .08 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [products])

  const fmt = n => '₩' + n.toLocaleString('ko-KR')

  const addToCart = (product) => {
    setCart(prev => {
      const next = { ...prev }
      next[product.id] = next[product.id]
        ? { ...next[product.id], qty: next[product.id].qty + 1 }
        : { ...product, qty: 1 }
      return next
    })
    setCartOpen(true)
  }

  const changeQty = (id, delta) => {
    setCart(prev => {
      const next = { ...prev }
      next[id] = { ...next[id], qty: next[id].qty + delta }
      if (next[id].qty <= 0) delete next[id]
      return next
    })
  }

  const removeItem = id => setCart(prev => { const n = { ...prev }; delete n[id]; return n })

  const cartItems = Object.values(cart)
  const cartTotal = cartItems.reduce((s,i) => s + i.price * i.qty, 0)
  const cartCount = cartItems.reduce((s,i) => s + i.qty, 0)

  const BG_MAP = {
    fashion:'linear-gradient(145deg,#F0E8DC,#E0D4C4)',
    food:'linear-gradient(145deg,#D8E4DC,#C4D8CC)',
    beauty:'linear-gradient(145deg,#E4D8D0,#D4C4BC)',
    lifestyle:'linear-gradient(145deg,#E8E0CC,#D8D0BC)',
    health:'linear-gradient(145deg,#DCDCE8,#CCCCE0)',
  }

  return (
    <>
      <Head>
        <title>FORMA GIFT — 마음을 담은 선물</title>
        <meta name="description" content="가장 소중한 사람에게 전하는 정성. 기억에 남는 선물을 큐레이션합니다." />
      </Head>

      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="ring"></div>

      <div className={`cart-backdrop${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />

      <div className={`cart-panel${cartOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2>장바구니</h2>
          <button className="cart-close" onClick={() => setCartOpen(false)}>×</button>
        </div>
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🎁</span>
              <span className="cart-empty-text">장바구니가 비었습니다</span>
            </div>
          ) : cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="ci-thumb" style={{ background: BG_MAP[item.category] || BG_MAP.fashion }}>
                {item.images?.[0]
                  ? <img src={item.images[0].url} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  : item.emoji || '📦'}
              </div>
              <div className="ci-info">
                <p className="ci-cat">{item.category_label || item.category}</p>
                <p className="ci-name">{item.name}</p>
                <div className="ci-row">
                  <div className="ci-qty">
                    <button onClick={() => changeQty(item.id, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)}>+</button>
                  </div>
                  <span className="ci-price">{fmt(item.price * item.qty)}</span>
                  <button className="ci-remove" onClick={() => removeItem(item.id)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">합계</span>
              <span className="cart-total-price">{fmt(cartTotal)}</span>
            </div>
            <button className="cart-checkout">구매하기</button>
            <button className="cart-continue" onClick={() => setCartOpen(false)}>쇼핑 계속하기 →</button>
          </div>
        )}
      </div>

      <nav id="nav">
        <a href="#" className="nav-logo">Forma<span>Gift Collection</span></a>
        <ul className="nav-links">
          <li><a href="#products">새 컬렉션</a></li>
          <li><a href="/products?category=fashion">패션</a></li>
          <li><a href="/products?category=food">푸드</a></li>
          <li><a href="/products?category=lifestyle">라이프</a></li>
          <li><a href="#story">브랜드</a></li>
        </ul>
        <div className="nav-right">
          <button className="nav-gift-btn">선물 추천받기</button>
          <button className="cart-icon" onClick={() => setCartOpen(true)}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <section className="hero" style={{padding:0}}>
        <div className="hero-left">
          <p className="hero-eyebrow">2025 Gift Collection</p>

<svg width="64" height="40" viewBox="0 0 64 40" fill="none"
  style={{ marginBottom: 28, opacity: 0, animation: 'up .9s .4s forwards' }}>
  <rect x="28" y="0" width="8" height="40" fill="#6B2737"/>
  <rect x="0" y="16" width="64" height="8" fill="#6B2737"/>
  <ellipse cx="32" cy="20" rx="10" ry="10" fill="#6B2737" stroke="#EDD898" strokeWidth="2"/>
  <ellipse cx="14" cy="20" rx="10" ry="7" fill="#6B2737" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
  <ellipse cx="50" cy="20" rx="10" ry="7" fill="#6B2737" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
  <circle cx="32" cy="20" r="5" fill="#B8932A"/>
</svg>

<h1 className="hero-title">마음을<br/><em>담아</em><br/>전하다</h1>
          <p className="hero-sub">가장 소중한 사람에게 전하는 정성. 단순한 물건이 아닌, 기억에 남는 선물을 큐레이션합니다.</p>
          <div className="hero-cta">
            <a href="#products" className="btn-primary-dark">선물 고르기</a>
            <a href="#story" className="btn-ghost-light">선물 가이드</a>
          </div>
        </div>
        <div className="hero-bow"><div className="bow-knot"></div></div>
        <div className="hero-right">
          {[{top:'25%',left:'30%',dur:'3.5s',delay:'0s',tx:'15px',ty:'-50px'},{top:'40%',left:'70%',dur:'4s',delay:'.8s',tx:'-20px',ty:'-40px'},{top:'65%',left:'45%',dur:'3s',delay:'1.5s',tx:'25px',ty:'-35px'},{top:'20%',left:'55%',dur:'5s',delay:'.3s',tx:'-10px',ty:'-60px'}].map((s,i) => (
            <div key={i} className="sparkle" style={{top:s.top,left:s.left,'--dur':s.dur,'--delay':s.delay,'--tx':s.tx,'--ty':s.ty}}/>
          ))}
          <div className="gift-box-visual">
            <div className="gbox-lid"><span className="gbox-lid-label">Forma Gift</span></div>
            <div className="gbox-body">
              <div className="gbox-ribbon-v"></div>
              <div className="gbox-content">🎁</div>
              <div className="gbox-tag">FOR YOU</div>
            </div>
          </div>
          <div className="hero-badge"><span>무료&nbsp;·&nbsp;선물<br/>포장&nbsp;서비스</span></div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-inner">
          {['생일 선물','기념일 선물','감사 선물','집들이 선물','명절 선물','무료 선물 포장','생일 선물','기념일 선물','감사 선물','집들이 선물','명절 선물','무료 선물 포장'].map((t,i) => (
            <span key={i}><span className="marquee-item">{t}</span><span className="marquee-diamond"/></span>
          ))}
        </div>
      </div>

      <section id="products">
        <div className="product-header reveal">
          <div>
            <p className="section-label">New Arrivals</p>
            <h2 className="section-title">신상품 <em>컬렉션</em></h2>
          </div>
          <a href="/products" className="see-all">전체 보기 →</a>
        </div>
        <div className="product-grid">
          {products.map((p,i) => (
            <div key={p.id} className={`product-card reveal rd${(i%5)+1}`}>
              <a href={`/products/${p.id}`} style={{display:'block'}}>
                <div className="pcard-img">
                  <div className="pcard-img-inner" style={{background: p.images?.[0] ? '#F5F0E8' : BG_MAP[p.category]||BG_MAP.fashion}}>
                    {p.images?.[0]
                      ? <img src={p.images[0].url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : p.emoji||'📦'}
                  </div>
                  <div className="pcard-overlay">
                    <button className="pcard-overlay-btn" onClick={e=>{e.preventDefault();addToCart(p)}}>장바구니 담기</button>
                  </div>
                </div>
              </a>
              <div className="pcard-info">
                <p className="pcard-category">{p.category_label||p.category}</p>
                <p className="pcard-name">{p.name}</p>
                <div className="pcard-price">
                  <span>{fmt(p.price)}</span>
                  {p.tag && <span className="pcard-tag">{p.tag}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="gold-divider"/>
      <section id="story" style={{padding:0}}>
        <div className="editorial-grid reveal">
          <div className="editorial-main">
            <span className="ed-big">GF</span>
            <p className="ed-tag">브랜드 스토리</p>
            <h2 className="ed-title">좋은 선물은<br/><em>오래</em> 기억됩니다</h2>
            <p className="ed-desc">선물은 물건이 아닙니다. 당신이 그 사람을 얼마나 생각했는지의 무게입니다. Forma는 그 무게를 함께 담습니다.</p>
            <a href="#" className="btn-primary-dark" style={{width:'fit-content'}}>스토리 읽기</a>
          </div>
          <div className="editorial-side">
            <a href="/products?category=food" className="ed-small es-bg-1">
              <span className="ed-small-emoji">🌾</span>
              <p className="ed-small-label">식품 큐레이션</p>
              <p className="ed-small-title">산지 직송<br/>프리미엄 식재료</p>
              <span className="see-all" style={{color:'var(--ink2)'}}>보러 가기 →</span>
            </a>
            <a href="/products?tag=SALE" className="ed-small es-bg-2">
              <span className="ed-small-emoji">✨</span>
              <p className="ed-small-label">시즌 선물 특가</p>
              <p className="ed-small-title">여름 선물<br/>최대 30% 할인</p>
              <span className="see-all" style={{color:'var(--ink2)'}}>보러 가기 →</span>
            </a>
          </div>
        </div>
      </section>

      <div className="api-section">
        <div className="api-inner">
          <div className="api-header">
            <div>
              <p className="api-eyebrow">개발자 &amp; 파트너 전용</p>
              <h2 className="api-title">선물을 <em>자동으로</em><br/>업로드하세요</h2>
              <p className="api-desc">REST API를 통해 어떤 시스템에서도 상품을 자동 등록할 수 있습니다.</p>
            </div>
            <div className="api-code">
              <span className="code-line"><span className="cc"># 상품 자동 등록 예시</span></span>
              <span className="code-line">&nbsp;</span>
              <span className="code-line">POST /api/v1/products</span>
              <span className="code-line">Authorization: Bearer <span className="cs">sk-live-xxxx</span></span>
              <span className="code-line">&nbsp;</span>
              <span className="code-line">{'{'}</span>
              <span className="code-line">&nbsp;&nbsp;<span className="ck">"name"</span>: <span className="cs">"선물 상품명"</span>,</span>
              <span className="code-line">&nbsp;&nbsp;<span className="ck">"price"</span>: <span className="cn">35000</span>,</span>
              <span className="code-line">&nbsp;&nbsp;<span className="ck">"category"</span>: <span className="cs">"lifestyle"</span></span>
              <span className="code-line">{'}'}</span>
            </div>
          </div>
          <div className="api-feats">
            {[{n:'01',t:'REST API 제공',d:'상품 등록, 수정, 재고 동기화, 주문 조회까지.'},{n:'02',t:'API Key 인증',d:'파트너사/채널별 키 발급. 권한과 Rate Limit 개별 설정.'},{n:'03',t:'Webhook 알림',d:'주문 발생, 재고 소진 이벤트를 실시간으로 전송.'}].map(f => (
              <div key={f.n} className="api-feat">
                <p className="af-n">{f.n}</p>
                <p className="af-t">{f.t}</p>
                <p className="af-d">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <div>
          <span className="footer-logo">Forma</span>
          <span className="footer-sub">Gift Collection</span>
          <p className="footer-desc">마음을 담아 전합니다.<br/>가장 소중한 사람에게 전하는 정성.</p>
          <p style={{fontSize:11,letterSpacing:'.05em',color:'rgba(255,255,255,.2)'}}>© 2025 Forma Store. All rights reserved.</p>
        </div>
        {[{head:'카테고리',links:[['패션 & 의류','/products?category=fashion'],['식품 & 먹거리','/products?category=food'],['뷰티 & 케어','/products?category=beauty'],['라이프스타일','/products?category=lifestyle'],['건강 & 웰니스','/products?category=health']]},{head:'고객센터',links:[['공지사항','#'],['자주 묻는 질문','#'],['교환 & 반품','#'],['배송 안내','#']]},{head:'파트너',links:[['API 문서','#'],['입점 문의','#'],['공급사 로그인','#'],['SDK 다운로드','#']]}].map(col => (
          <div key={col.head}>
            <p className="footer-head">{col.head}</p>
            <ul className="footer-links">
              {col.links.map(([label,href]) => <li key={label}><a href={href}>{label}</a></li>)}
            </ul>
          </div>
        ))}
      </footer>
      <div className="footer-bottom">
        <span>FORMA — GIFT COLLECTION 2025</span>
        <span>개인정보처리방침 · 이용약관</span>
      </div>
    </>
  )
}
