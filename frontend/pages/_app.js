import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('admin-page')
    } else {
      document.body.classList.remove('admin-page')
    }
  }, [isAdmin])

  return <Component {...pageProps} />
}
