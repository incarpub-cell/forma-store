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

  useEffect(() => {
    if (isAdmin) return

    const cur = document.getElementById('cursor')
    const ring = document.getElementById('ring')
    if (!cur || !ring) return

    let mx=0, my=0, rx=0, ry=0, raf
    const onMove = e => {
      mx = e.clientX; my = e.clientY
      cur.style.left = mx + 'px'
      cur.style.top  = my + 'px'
    }
    const animate = () => {
      rx += (mx - rx) * 0.1
      ry += (my - ry) * 0.1
      ring.style.left = rx + 'px'
      ring.style.top  = ry + 'px'
      raf = requestAnimationFrame(animate)
    }
    animate()
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [router.pathname, isAdmin])

  return (
    <>
      {!isAdmin && (
        <>
          <div id="cursor" className="cursor" />
          <div id="ring" className="cursor-ring" />
        </>
      )}
      <Component {...pageProps} />
    </>
  )
}