import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 만약 나중에 빌드 경로 문제가 또 생기면 여기에 추가 설정 넣기 
  // 지금은 가장 기본 설정
})