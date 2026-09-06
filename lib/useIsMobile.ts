'use client'

import { useEffect, useState } from 'react'

/**
 * Detect chế độ mobile (màn hình hẹp < 820px). Trả về { isMobile, ready }.
 * - ssrMobile: do server truyền từ user-agent để lần render đầu ĐÃ ĐÚNG giao
 *   diện — tránh "nháy desktop 1s rồi nhảy qua mobile" lúc khởi động.
 * - ready=false chỉ trong pha SSR/mount; sau đó matchMedia điều chỉnh lại thật.
 */
export function useIsMobile(query = '(max-width: 820px)', ssrMobile = false) {
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(ssrMobile)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    setReady(true)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return { isMobile, ready }
}