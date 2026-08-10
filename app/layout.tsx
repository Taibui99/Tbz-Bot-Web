import type { Metadata } from 'next'
import './globals.css'
import './performance.css'

export const metadata: Metadata = {
  title: 'TBZ-BOT // Control Center',
  description: 'Realtime control center for TBZ-BOT',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>
}
