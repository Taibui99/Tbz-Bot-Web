'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALLED_KEY = 'tbz_pwa_installed'
const DISMISS_KEY = 'tbz_pwa_dismissed'

export default function PwaInstaller() {
  const [show, setShow] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Đã cài (standalone hay đã cài 1 lần trước) → không hỏi nữa.
    try {
      if (window.matchMedia?.('(display-mode: standalone)').matches) {
        localStorage.setItem(INSTALLED_KEY, '1')
        return
      }
      if (localStorage.getItem(INSTALLED_KEY)) return
    } catch {
      /* môi trường hạn chế localStorage — coi như chưa cài */
    }

    // "Để sau" chỉ bỏ qua trong PHIÊN này: mở lại web (dù chưa cài) sẽ hỏi lại.
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return
    } catch {
      /* không sessionStorage được thì cứ hỏi */
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, '1')
      } catch {
        /* ignore */
      }
      setShow(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // Browser có nút cài native (Android/Desktop Chrome) hoặc iOS (cài tay)
    // đều cần sheet — hiện sau 3s kể cả khi beforeinstallprompt không bắn.
    const timer = window.setTimeout(() => setShow(true), 3000)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canInstall = deferred || isIOS
  if (!show || !canInstall) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  const install = async () => {
    try {
      if (deferred) {
        // Bắn dialog cài đặt native của trình duyệt
        deferred.prompt()
        await deferred.userChoice.catch(() => {})
      }
      localStorage.setItem(INSTALLED_KEY, '1')
    } catch {
      /* ignore */
    }
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
              Thôi, để sau
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}