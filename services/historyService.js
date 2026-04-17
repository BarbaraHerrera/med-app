import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export const addToHistory = async ({ professionalId, type, title }) => {
  const user = auth.currentUser;

  if (!user?.uid) return;

  await addDoc(collection(db, 'users', user.uid, 'history'), {
    professionalId,
    type,
    title,
    createdAt: serverTimestamp(),
  });
};