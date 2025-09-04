import { db, storage } from '../firebase';
import { getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- 1. 사용자 온보딩 및 프로필 로직 ---

/**
 * 사용자가 처음 로그인했는지 확인, 첫 로그인이라면 프로필 생성
 * @param {object} user
 * @returns {Promise<object>}
 */
export const checkAndCreateUserProfile = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // 새로운 사용자 -> 프로필 문서 생성
    await setDoc(userRef, {
      email: user.email,
      createdAt: serverTimestamp(),
      hasCompletedOnboarding: false, // 온보딩 미완료 상태
    });
    const newUserSnap = await getDoc(userRef);
    return newUserSnap.data();
  }
  return userSnap.data();
};

/**
 * 사용자의 온보딩 상태를 '완료'로 업데이트
 * @param {string} userId
 */
export const completeOnboarding = async (userId) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { hasCompletedOnboarding: true }, { merge: true });
};


// --- 2. 카테고리 로직 ---

/**
 * 사용자의 모든 카테고리를 가져오기
 * @param {string} userId
 * @returns {Promise<Array>} 카테고리 객체 배열
 */
export const getUserCategories = async (userId) => {
  const categoriesCol = collection(db, 'categories');
  const q = query(categoriesCol, where('userId', '==', userId), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * 새로운 카테고리 추가
 * @param {string} userId
 * @param {string} categoryName 새 카테고리 이름
 */
export const addCategory = async (userId, categoryName) => {
  await addDoc(collection(db, 'categories'), {
    userId: userId,
    name: categoryName,
    createdAt: serverTimestamp(),
  });
};

/**
 * 온보딩 과정에서 여러 카테고리를 한 번에 추가
 * @param {string} userId
 * @param {Array<string>} categoryNames 추가할 카테고리 이름 배열
 */
export const addInitialCategories = async (userId, categoryNames) => {
    const batch = writeBatch(db);
    const categoriesCol = collection(db, 'categories');

    categoryNames.forEach(name => {
        const newCategoryRef = doc(categoriesCol);
        batch.set(newCategoryRef, {
            userId: userId,
            name: name,
            createdAt: serverTimestamp(),
        });
    });

    await batch.commit();
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
export const getScrapsByCategory = async (categoryId) => {
  const scrapsCol = collection(db, 'scraps');
  const q = query(scrapsCol, where('categoryId', '==', categoryId), orderBy('createdAt', 'desc'));
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

import { doc, deleteDoc } from 'firebase/firestore'; // deleteDoc import 추가

// ... 기존 함수들 ...

/**
 * ID를 이용해 스크랩 문서 삭제
 * @param {string} scrapId - 삭제할 스크랩의 문서 ID
 */
export const deleteScrap = async (scrapId) => {
  const scrapRef = doc(db, 'scraps', scrapId);
  await deleteDoc(scrapRef);
};