import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { apiFetch } from '../../lib/store'
import styles from '../../styles/Admin.module.css'

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (data.user.role !== 'admin') {
        setError('관리자 계정이 아닙니다')
        return
      }
      localStorage.setItem('admin_token', data.token)
      router.push('/admin/dashboard')
    } catch {
      setError('이메일 또는 비밀번호가 틀렸습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>관리자 로그인 — FORMA</title></Head>
      <div className={styles.loginWrap}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginLogo}>Forma</h1>
          <p className={styles.loginSub}>관리자 페이지</p>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.field}>
            <label>이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@forma.com"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>
          <div className={styles.field}>
            <label>비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>
          <button className={styles.loginBtn} onClick={login} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </>
  )
}
