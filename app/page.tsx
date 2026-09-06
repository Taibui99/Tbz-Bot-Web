import { headers } from 'next/headers'
import HomeClient from '@/components/HomeClient'

export default async function Page() {
  // Đọc user-agent NGAY TRÊN SERVER: render đúng giao diện ở lần HTML đầu,
  // điện thoại không còn thấy "nháy desktop 1s" lúc khởi động.
  const h = await headers()
  const ua = h.get('user-agent') ?? ''
  const ssrMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)
  return <HomeClient ssrMobile={ssrMobile} />
}