import { useEffect, useRef } from 'react'
import styles from './Cursor.module.css'

export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos = useRef({ x: 0, y: 0, rx: 0, ry: 0 })

  useEffect(() => {
    const onMove = (e) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', onMove)

    let raf
    const animate = () => {
      pos.current.rx += (pos.current.x - pos.current.rx) * 0.12
      pos.current.ry += (pos.current.y - pos.current.ry) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = pos.current.rx + 'px'
        ringRef.current.style.top  = pos.current.ry + 'px'
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    const hover = () => {
      dotRef.current?.classList.add(styles.hover)
      ringRef.current?.classList.add(styles.hover)
    }
    const unhover = () => {
      dotRef.current?.classList.remove(styles.hover)
      ringRef.current?.classList.remove(styles.hover)
    }
    document.querySelectorAll('a,button,[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', hover)
      el.addEventListener('mouseleave', unhover)
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className={styles.dot}  />
      <div ref={ringRef} className={styles.ring} />
    </>
  )
}
