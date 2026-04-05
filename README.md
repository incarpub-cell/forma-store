# FORMA Store — 풀스택 온라인스토어

스마트스토어와 차별화된 브랜드 감성 커머스 플랫폼.
외부 시스템에서 REST API로 상품을 자동 업로드할 수 있습니다.

---

## 🗂 프로젝트 구조

```
forma-store/
├── frontend/          # Next.js 14 (Vercel 배포)
│   ├── pages/
│   │   ├── index.js           # 홈
│   │   ├── products/
│   │   │   ├── index.js       # 목록 + 필터
│   │   │   └── [id].js        # 상품 상세
│   ├── components/
│   │   ├── Cursor.js          # 커스텀 커서
│   │   ├── Nav.js             # 네비게이션
│   │   ├── CartDrawer.js      # 슬라이드 장바구니
│   │   └── ProductCard.js     # 상품 카드
│   ├── lib/
│   │   └── store.js           # Zustand (장바구니, API helper)
│   └── styles/
│
├── backend/           # Node.js + Express (Railway 배포)
│   ├── server.js              # 메인 서버
│   ├── db/
│   │   ├── index.js           # DB 연결 풀
│   │   ├── migrate.js         # 스키마 마이그레이션
│   │   └── seed.js            # 샘플 데이터
│   ├── middleware/
│   │   └── auth.js            # JWT + API Key 인증
│   └── routes/
│       ├── products.js        # 공개 상품 API
│       ├── orders.js          # 주문
│       ├── auth.js            # 로그인/회원가입
│       ├── api.js             # 외부 자동업로드 API (/api/v1)
│       ├── admin.js           # 관리자 CMS
│       └── webhooks.js        # Webhook 발송
│
└── docs/
    └── api.md                 # API 문서
```

---

## 🚀 로컬 개발 시작

### 1. PostgreSQL 준비
```bash
# Docker로 빠르게 실행
docker run -d \
  --name forma-db \
  -e POSTGRES_DB=forma_store \
  -e POSTGRES_USER=forma \
  -e POSTGRES_PASSWORD=forma1234 \
  -p 5432:5432 \
  postgres:15
```

### 2. 백엔드 실행
```bash
cd backend
cp ../.env.example .env
# .env 파일에서 DATABASE_URL 수정

npm install
node db/migrate.js    # 스키마 생성
node db/seed.js       # 샘플 데이터 삽입
npm run dev           # 포트 4000
```

### 3. 프론트엔드 실행
```bash
cd frontend
cp ../.env.example .env.local
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:4000

npm install
npm run dev           # 포트 3000
```

브라우저에서 http://localhost:3000 열기 ✅

---

## 🌐 배포

### 프론트엔드 → Vercel
```bash
cd frontend
npx vercel --prod

# 환경변수 설정
vercel env add NEXT_PUBLIC_API_URL production
# → https://forma-store-api.railway.app 입력
```

### 백엔드 → Railway
1. https://railway.app 에서 새 프로젝트 생성
2. GitHub 레포 연결 → `/backend` 디렉토리 선택
3. PostgreSQL 플러그인 추가 (DATABASE_URL 자동 생성)
4. 환경변수 추가:
   - `JWT_SECRET` = 랜덤 긴 문자열
   - `FRONTEND_URL` = https://your-store.vercel.app
5. Deploy 클릭

배포 후 터미널에서 마이그레이션:
```bash
railway run node db/migrate.js
railway run node db/seed.js
```

---

## 🔑 외부 API 자동 업로드

### API 키 발급 (관리자)
```bash
curl -X POST https://your-api.railway.app/api/v1/keys \
  -H "Authorization: Bearer {ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"label":"공급사A", "permissions":["products:write"]}'
```

### 상품 단건 등록
```bash
curl -X POST https://your-api.railway.app/api/v1/products \
  -H "Authorization: Bearer sk-live-xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "신상품 이름",
    "price": 35000,
    "category": "fashion",
    "stock": 100,
    "description": "상품 설명",
    "emoji": "👗"
  }'
```

### 상품 대량 등록 (CSV → API)
```python
# Python 예시: Google 시트 / CSV에서 자동 업로드
import requests, csv

API = "https://your-api.railway.app/api/v1"
KEY = "sk-live-xxxxxxxxxxxx"

with open("products.csv") as f:
    products = list(csv.DictReader(f))

res = requests.post(f"{API}/products/bulk",
    headers={"Authorization": f"Bearer {KEY}"},
    json={"products": products}
)
print(res.json())  # { created: 50, errors: 0 }
```

### 재고 일괄 동기화
```bash
curl -X POST .../api/v1/inventory/sync \
  -H "Authorization: Bearer sk-live-xxxx" \
  -d '{"items":[
    {"product_id":"uuid-1","stock":50},
    {"product_id":"uuid-2","stock":0}
  ]}'
```

---

## 📋 API 전체 엔드포인트

| Method | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/auth/register | — | 회원가입 |
| POST | /api/auth/login | — | 로그인 |
| GET | /api/products | — | 상품 목록 |
| GET | /api/products/:id | — | 상품 상세 |
| POST | /api/orders | JWT | 주문 생성 |
| GET | /api/orders | JWT | 내 주문 목록 |
| **POST** | **/api/v1/products** | **API Key** | **상품 등록** |
| **POST** | **/api/v1/products/bulk** | **API Key** | **대량 등록** |
| **PUT** | **/api/v1/products/:id** | **API Key** | **전체 수정** |
| **PATCH** | **/api/v1/products/:id** | **API Key** | **부분 수정** |
| **DELETE** | **/api/v1/products/:id** | **API Key** | **삭제** |
| **POST** | **/api/v1/inventory/sync** | **API Key** | **재고 동기화** |
| GET | /api/admin/dashboard | JWT(admin) | 통계 |
| GET | /api/admin/products | JWT(admin) | 전체 상품 관리 |

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14, CSS Modules, Zustand, SWR |
| 백엔드 | Node.js, Express, Zod |
| DB | PostgreSQL 15 |
| 인증 | JWT (사용자) + API Key bcrypt (외부 API) |
| 배포 | Vercel (FE) + Railway (BE + DB) |
| 자동화 연동 | REST API → ERP / Python / Zapier / Google Sheets |
