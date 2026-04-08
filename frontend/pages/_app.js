import '../styles/globals.css'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  // 관리자 페이지는 별도 레이아웃
  const isAdmin = router.pathname.startsWith('/admin')

  // 관리자 페이지는 globals.css만 적용, 나머지는 각 페이지가 자체 처리
  return <Component {...pageProps} />
}
