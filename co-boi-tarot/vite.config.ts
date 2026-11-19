import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // lvh.me trỏ về 127.0.0.1; TikTok LIVE Studio không nhận "localhost".
    // true = Vite không tự lọc Host (để điện thoại mở stage bằng IP LAN động): lớp chặn thật là
    // middleware hostOk trong server.ts chạy TRƯỚC Vite (chỉ nhận tên nội bộ + IP LAN riêng,
    // tên miền công cộng vẫn 403). Đừng dựa vào allowedHosts của Vite để bảo vệ server này.
    allowedHosts: true,
  },
});
