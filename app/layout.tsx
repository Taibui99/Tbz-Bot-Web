import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import SwRegister from '@/components/SwRegister'
import PwaInstaller from '@/components/PwaInstaller'

export const metadata: Metadata = {
  title: 'TBZ-BOT // Control Center',
  description: 'Realtime control center for TBZ-BOT',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TBZ-BOT',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
        <SwRegister />
        <PwaInstaller />
      </body>
    </html>
  )
}