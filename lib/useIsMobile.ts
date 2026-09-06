'use client'

import { useEffect, useState } from 'react'

/**
 * Detect chế độ mobile (màn hình hẹp < 820px). Trả về { isMobile, ready }:
 * - ready=false trong render đầu (SSR + mount) để mobile không lướt qua desktop.
 * - isMobile=true khi viewport chuyển sang màn hình nhỏ, tự cập nhật khi xoay/xẹp.
 */
export function useIsMobile(query = '(max-width: 820px)') {
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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