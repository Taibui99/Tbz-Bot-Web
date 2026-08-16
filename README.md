# TBZ-BOT Web

Control center cho bot Zalo + Gemini — giao diện liquid glass kiểu Apple, dark theme, realtime.

## Tính năng

- **Tổng quan**: trạng thái bot, uptime, lưu lượng tin nhắn 7 ngày (chart), thời gian phản hồi, sức khỏe hệ thống, gửi tin thử nhanh.
- **Hội thoại**: lịch sử trò chuyện thật từ bot, tìm kiếm, lọc theo loại, xoá ngữ cảnh từng chat.
- **Live Logs**: SSE realtime (không timeout), lọc từ khoá + mức độ, auto-scroll, tạm dừng.
- **Stickers**: chỉnh sửa thư viện sticker (sticker_id + verified_code), test gửi về chủ bot, import/export JSON.
- **Scheduler**: chào buổi sáng + thời khóa biểu từng ngày, copy ngày, import/export JSON.
- **Cài đặt**: owner chat ID, vị trí thời tiết, hộp thử gửi text/voice/ảnh AI, thông tin cấu hình bot, danger zone.

## Cài đặt

Biến môi trường (set trên Vercel):

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `BOT_API_URL` | ✅ | URL của bot FastAPI, vd `https://tbz-zalo-bot.onrender.com` |
| `ADMIN_TOKEN` | tuỳ chọn | Nếu set, web yêu cầu đăng nhập token; đồng thời phải set `ADMIN_TOKEN` **cùng giá trị** trên Render để bot chấp nhận request |

> Bot cũng có thể tự set `ADMIN_TOKEN` (Render) để chặn ai gọi thẳng API bot khi web không dùng. Giao thức: header `X-Admin-Token`.

## Chạy local

```bash
npm install
npm run dev
```

## Chạy production

```bash
npm run build && npm start
```

Build không cần hack: không còn `node -e` chữa lỗi `dateText` và không còn workflow `temp-fix`.