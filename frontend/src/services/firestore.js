import { db, storage } from '../firebase';
import { 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  writeBatch,
  doc,
  deleteDoc,
  arrayUnion, 
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * 카테고리 삭제 시 스크랩들을 다른 카테고리로 이동시키는 함수
 * @param {string} userId
 * @param {string} categoryIdToDelete
 * @param {string} targetCategoryId
 */

export const moveScrapsAndDeleteCategory = async (userId, categoryIdToDelete, targetCategoryId) => {
  if (!userId || !categoryIdToDelete || !targetCategoryId) {
    throw new Error("필수 인자가 누락되었습니다.");
  }
  
  const scrapsRef = collection(db, 'scraps');
  const q = query(scrapsRef, where('userId', '==', userId), where('categoryId', '==', categoryIdToDelete));
  
  const scrapDocs = await getDocs(q);
  
  if (!scrapDocs.empty) {
    // 이동할 스크랩이 있는 경우
    const batch = writeBatch(db);
    scrapDocs.forEach(scrapDoc => {
      const scrapRef = doc(db, 'scraps', scrapDoc.id);
      // categoryId 필드를 새로운 카테고리 ID로 업데이트
      batch.update(scrapRef, { categoryId: targetCategoryId });
    });
    // 배치 작업을 통해 모든 스크랩을 한 번에 이동
    await batch.commit();
  }
    // 스크랩 이동이 완료된 후, sessions 문서에서 해당 카테고리를 배열에서 제거
    const sessionRef = doc(db, 'sessions', userId);
    // categories 배열에서 categoryIdToDelete를 제거
    await setDoc(sessionRef, {
        categories: arrayRemove(categoryIdToDelete) 
    }, { merge: true });
};

// --- 2. 카테고리 로직 ---
/**
 * 사용자의 모든 카테고리를 가져오기
 * @param {string} userId
 * @returns {Promise<Array>} 카테고리 객체 배열
 */
export const getUserCategories = async (userId) => {
  const sessionRef = doc(db, 'sessions', userId);
  const sessionSnap = await getDoc(sessionRef);
  if (sessionSnap.exists() && sessionSnap.data().categories) {
    // Onboarding에서 저장한 카테고리 배열 반환
    const categoryNames = sessionSnap.data().categories;
  return categoryNames.map(name => ({ id: name, name: name }));
  }
  return [];
};

/**
 * 새로운 카테고리 추가
 * @param {string} userId 
 * @param {string} categoryName 새 카테고리 이름
 */
export const addCategory = async (userId, categoryName) => {
  const sessionRef = doc(db, 'sessions', userId);
  await setDoc(sessionRef, {
    categories: arrayUnion(categoryName.trim()) 
  }, { merge: true });
};

/**
 * 온보딩 과정에서 여러 카테고리를 한 번에 추가
 * @param {string} userId
 * @param {Array<string>} categoryNames 추가할 카테고리 이름 배열
 */
export const addInitialCategories = async (userId, categoryNames) => {
    const sessionRef = doc(db, 'sessions', userId);
    await setDoc(sessionRef, {
        categories: categoryNames,
        createdAt: serverTimestamp(),
        userId: userId
    }, { merge: true });
};

// --- 3. 스크랩 로직 ---
/**
 * 새로운 스크랩 추가
 * @param {string} userId
 * @param {string} categoryId
 * @param {object} scrapData
 */
export const addScrap = async (userId, categoryId, scrapData) => {
  await addDoc(collection(db, 'scraps'), {
    userId,
    categoryId,
    ...scrapData, // type, data 포함
    createdAt: serverTimestamp(),
  });
};

/**
 * 특정 카테고리의 모든 스크랩을 가져옴
 * @param {string} categoryId
 * @returns {Promise<Array>}
 */
export const getScrapsByCategory = async (userId, categoryId) => {
  // userId 인자를 받도록 수정
  const scrapsRef = collection(db, 'scraps');
  const q = query(
    scrapsRef,
    where('userId', '==', userId),
    where('categoryId', '==', categoryId),
    orderBy('createdAt', 'desc') // 최신순으로 정렬
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * 이미지를 Firebase Storage에 업로드하고 URL을 반환
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} 업로드된 이미지의 다운로드 URL
 */
export const uploadImage = async (userId, file) => {
  const storageRef = ref(storage, `scrap_images/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

/**
 * ID를 이용해 스크랩 문서 삭제
 * @param {string} scrapId - 삭제할 스크랩의 문서 ID
 */
export const deleteScrap = async (scrapId) => {
  const scrapRef = doc(db, 'scraps', scrapId);
  await deleteDoc(scrapRef);
};

// 카테고리 삭제
export const deleteCategory = async (userId, categoryId) => {
  // 경고: 이 카테고리에 속한 스크랩들은 어떻게 처리할지 정책 결정이 필요합니다.
  // 우선은 카테고리만 삭제하고, 스크랩은 그대로 두는 방식으로 구현합니다.
  await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
};