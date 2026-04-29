import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import styles from '../../styles/Admin.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const CATEGORIES = ['fashion','food','beauty','lifestyle','health']
const CAT_LABEL  = { fashion:'패션', food:'식품', beauty:'뷰티', lifestyle:'라이프', health:'건강' }

function BulkUpload({ token, onDone }) {
  const [step, setStep]             = useState(1)   // 1:엑셀 2:이미지 3:결과
  const [bulkProducts, setBulkProducts] = useState([])
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
      setBulkProducts(parsed)
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
    try {
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
      const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' })
      const blob = new Blob([wbout], { type:'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'forma_상품등록_양식.xlsx'
      a.style.display = 'none'
      a.addEventListener('click', e => e.stopPropagation())
      document.body.appendChild(a)
      setTimeout(() => {
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 100)
      }, 0)
    } catch(err) {
      console.error('다운로드 오류:', err)
      alert('다운로드 오류: ' + err.message)
    }
  }

  // ── 등록 실행 ──
  const startUpload = async () => {
    setStep(3)
    setLogs([])
    setResult(null)
    let success = 0, failed = 0

    for (let i = 0; i < bulkProducts.length; i++) {
      const p = bulkProducts[i]
      setProgress({ current:i+1, total:bulkProducts.length, label:`${p.name}` })
      addLog('info', `[${i+1}/${bulkProducts.length}] ${p.name} 처리 중...`)

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
    setProgress({ current:bulkProducts.length, total:bulkProducts.length, label:'완료!' })
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
          <div className={styles.uploadBanner} onClick={e=>e.stopPropagation()}>
            <div>
              <p style={{fontWeight:600,marginBottom:4}}>📋 엑셀 양식 다운로드</p>
              <p style={{fontSize:12,color:'#8C8880'}}>양식에 맞게 상품 정보를 입력 후 업로드하세요</p>
            </div>
            <button
              type="button"
              className={styles.addBtn}
              onClick={e=>{e.preventDefault();e.stopPropagation();downloadTemplate();}}
            >
              ⬇ 양식 다운로드
            </button>
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
          {bulkProducts.length > 0 && (
            <div style={{marginTop:24}}>
              <div className={styles.tabHeader} style={{marginBottom:12}}>
                <p style={{fontWeight:600}}>총 {bulkProducts.length}개 상품</p>
                <button className={styles.addBtn} onClick={()=>setStep(2)}>다음: 이미지 연결 →</button>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>상품명</th><th>가격</th><th>카테고리</th><th>재고</th><th>태그</th></tr>
                </thead>
                <tbody>
                  {bulkProducts.map((p,i)=>(
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{p.name}</td>
                      <td>₩{p.price.toLocaleString()}</td>
                      <td>
                        <select
                          value={p.category}
                          onChange={e=>setProducts(prev=>bulkPrev.map((x,xi)=>xi===i?{...x,category:e.target.value}:x))}
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

          {bulkProducts.map((p,pi)=>(
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
              🚀 전체 등록하기 ({bulkProducts.length}개)
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
              <button className={styles.cancelBtn} onClick={()=>{setStep(1);setBulkProducts([]);setImgFiles({});setLogs([]);setResult(null)}}>
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

export default BulkUpload
