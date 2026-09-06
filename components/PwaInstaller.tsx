'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const LS_KEY = 'tbz_pwa_dismissed'

export default function PwaInstaller() {
  const [show, setShow] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return
    if (localStorage.getItem(LS_KEY)) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // Chromium bắn beforeinstallprompt; nếu sau 4s chưa có (iOS/máy không đủ
    // điều kiện) thì hiện bảng hướng dẫn thủ công.
    const timer = window.setTimeout(() => {
      setShow(true)
    }, 4000)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(LS_KEY, '1')
    setShow(false)
  }

  const install = async () => {
    if (deferred) {
      deferred.prompt()
      await deferred.userChoice.catch(() => {})
    }
    localStorage.setItem(LS_KEY, '1')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="m-pwa-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="m-pwa-sheet"
            initial={{ y: 320 }}
            animate={{ y: 0 }}
            exit={{ y: 320 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="m-pwa-grab" />
            <button className="m-pwa-close" onClick={dismiss} aria-label="Đóng">
              <X size={18} />
            </button>

            <span className="m-pwa-icon">
              <Download size={22} />
            </span>
            <h4>Cài TBZ-BOT vào màn hình chính</h4>
            <p className="m-pwa-desc">
              Mở nhanh như app thật, toàn màn hình, không cần trình duyệt. Dữ liệu vẫn là dữ
              liệu thật từ bot.
            </p>

            {deferred && !isIOS ? (
              <button className="m-pwa-btn" onClick={install}>
                <Download size={16} />
                Cài đặt ngay
              </button>
            ) : (
              <div className="m-pwa-ios">
                <p>
                  Trình duyệt của bạn chưa hỗ trợ nút cài tự động. Cài bằng tay như sau:
                </p>
                <ol>
                  <li>Chạm nút <b>Chia sẻ</b> <Share size={14} /> ở thanh trình duyệt (iOS) hoặc menu ⋮ (Android)</li>
                  <li>Chọn <b>Thêm vào Màn hình chính</b></li>
                  <li>Bấm <b>Thêm</b> để hoàn tất</li>
                </ol>
              </div>
            )}

            <button className="m-pwa-later" onClick={dismiss}>
              Để sau
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}