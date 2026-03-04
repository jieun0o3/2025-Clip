// App 초기 로드 시 실행
import { v4 as uuidv4 } from 'uuid';

export const getTemporaryUserId = () => {
  let userId = localStorage.getItem('CLIP_USER_SESSION_ID');

  if (!userId) {
    // ID가 없으면 새로 생성하여 localStorage에 저장
    userId = uuidv4(); 
    localStorage.setItem('CLIP_USER_SESSION_ID', userId);
  }

  return userId;
};