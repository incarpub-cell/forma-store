export default function Home() {
  // 장바구니 관련 임시 함수 (에러 방지용)
  const openCart = () => document.getElementById('cartPanel')?.classList.add('active');
  const closeCart = () => document.getElementById('cartPanel')?.classList.remove('active');
  const addToCart = () => alert('장바구니에 담겼습니다!');

  return (
    <>
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="ring"></div>

      {/* CART BACKDROP */}
      <div className="cart-backdrop" id="backdrop" onClick={closeCart}></div>

      {/* CART PANEL */}
      <div className="cart-panel" id="cartPanel">
        <div className="cart-header">
          <h2>장바구니</h2>
          <button className="cart-close" onClick={closeCart}>×</button>
        </div>
        <div className="cart-items" id="cartItems">
          <div className="cart-empty">
            <span className="cart-empty-icon">🎁</span>
            <span className="cart-empty-text">장바구니가 비었습니다</span>
          </div>
        </div>
        <div className="cart-footer" id="cartFooter" style={{ display: 'none' }}>
          <div className="cart-total">
            <span className="cart-total-label">합계</span>
            <span className="cart-total-price" id="cartTotal">₩0</span>
          </div>
          <button className="cart-checkout">구매하기</button>
          <button className="cart-continue" onClick={closeCart}>쇼핑 계속하기 →</button>
        </div>
      </div>

      {/* NAV */}
      <nav id="nav">
        <a href="#" className="nav-logo">
          Forma
          <span>Gift Collection</span>
        </a>
        <ul className="nav-links">
          <li><a href="#">새 컬렉션</a></li>
          <li><a href="#">패션</a></li>
          <li><a href="#">푸드</a></li>
          <li><a href="#">라이프</a></li>
          <li><a href="#story">브랜드</a></li>
        </ul>
        <div className="nav-right">
          <button className="nav-gift-btn">선물 추천받기</button>
          <button className="cart-icon" onClick={openCart}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" />
              <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="cart-badge" id="cartBadge">0</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ padding: 0 }}>
        <div className="hero-left">
          <p className="hero-eyebrow">2025 Gift Collection</p>
          <h1 className="hero-title">
            마음을<br />
            <em>담아</em><br />
            전하다
          </h1>
          <p className="hero-sub">가장 소중한 사람에게 전하는 정성. 단순한 물건이 아닌, 기억에 남는 선물을 큐레이션합니다.</p>
          <div className="hero-cta">
            <a href="#products" className="btn-primary-dark">선물 고르기</a>
            <a href="#guide" className="btn-ghost-light">선물 가이드</a>
          </div>
        </div>

        <div className="hero-bow">
          <div className="bow-knot"></div>
        </div>

        <div className="hero-right">
          <div className="sparkle" style={{ top: '25%', left: '30%', '--dur': '3.5s', '--delay': '0s', '--tx': '15px', '--ty': '-50px' }}></div>
          <div className="sparkle" style={{ top: '40%', left: '70%', '--dur': '4s', '--delay': '.8s', '--tx': '-20px', '--ty': '-40px' }}></div>
          <div className="sparkle" style={{ top: '65%', left: '45%', '--dur': '3s', '--delay': '1.5s', '--tx': '25px', '--ty': '-35px' }}></div>
          <div className="sparkle" style={{ top: '20%', left: '55%', '--dur': '5s', '--delay': '.3s', '--tx': '-10px', '--ty': '-60px' }}></div>

          <div className="gift-box-visual">
            <div className="gbox-lid">
              <span className="gbox-lid-label">Forma Gift</span>
            </div>
            <div className="gbox-body">
              <div className="gbox-ribbon-v"></div>
              <div className="gbox-content">🎁</div>
              <div className="gbox-tag">FOR YOU</div>
            </div>
          </div>

          <div className="hero-badge">
            <span>무료&nbsp;·&nbsp;선물<br />포장&nbsp;서비스</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          <span className="marquee-item">생일 선물</span><span className="marquee-diamond"></span>
          <span className="marquee-item">기념일 선물</span><span className="marquee-diamond"></span>
          <span className="marquee-item">감사 선물</span><span className="marquee-diamond"></span>
          <span className="marquee-item">집들이 선물</span><span className="marquee-diamond"></span>
          <span className="marquee-item">명절 선물</span><span className="marquee-diamond"></span>
          <span className="marquee-item">무료 선물 포장</span><span className="marquee-diamond"></span>
        </div>
      </div>

      {/* PRODUCTS (예시로 하나만 유지, 필요시 복사해서 사용) */}
      <section id="products">
        <div className="product-header">
          <div>
            <p className="section-label">New Arrivals</p>
            <h2 className="section-title">신상품 <em>컬렉션</em></h2>
          </div>
        </div>
        <div className="product-grid">
          <div className="product-card">
            <div className="pcard-img">
              <div className="pcard-img-inner" style={{ background: 'linear-gradient(145deg,#F0E8DC,#E0D4C4)' }}>🧥</div>
              <div className="pcard-overlay">
                <button className="pcard-overlay-btn" onClick={addToCart}>장바구니 담기</button>
              </div>
            </div>
            <div className="pcard-info">
              <p className="pcard-category">패션 / 아우터</p>
              <p className="pcard-name">코튼 오버핏 재킷</p>
              <div className="pcard-price"><span>₩128,000</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div>
          <span className="footer-logo">Forma</span>
          <p className="footer-desc">마음을 담아 전합니다.</p>
          <p style={{ fontSize: '11px' }}>© 2025 Forma Store. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}