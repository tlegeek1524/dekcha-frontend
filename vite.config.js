import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true, // <<< เปิด CORS เผื่อ ngrok ใช้
    origin: 'https://3653-49-228-243-255.ngrok-free.app', // <<< ใส่ origin เป็น ngrok URL ตรงๆ
  },
})
