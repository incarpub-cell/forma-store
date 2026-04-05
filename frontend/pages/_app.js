import '../styles/globals.css'
import { useEffect } from 'react'
import Cursor from '../components/Cursor'
import Nav from '../components/Nav'
import CartDrawer from '../components/CartDrawer'
import { useCartStore } from '../lib/store'

export default function App({ Component, pageProps }) {
  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Cursor />
      <Nav />
      <CartDrawer />
      <Component {...pageProps} />
    </>
  )
}
