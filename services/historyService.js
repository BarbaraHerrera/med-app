import { auth, db } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function addToHistory({
  professionalId,
  type,
  title,
}) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, 'users', uid, 'history'), {
      professionalId: professionalId || '',
      type: type || 'view',
      title: title || 'Actividad',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.log('Error guardando historial:', error);
  }
}

// Alias por compatibilidad si en otras pantallas usas saveHistory
export async function saveHistory(type, title, professionalId) {
  return addToHistory({
    professionalId,
    type,
    title,
  });
}