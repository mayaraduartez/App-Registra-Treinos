import { db, auth } from '../config/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const treinosCollectionRef = collection(db, 'TreinosRealizados');

export const treinosService = {
  // Registrar treino realizado
  registrar: async (
    fichaId: string,
    fichaNome: string,
    dataRealizacao: string,
    hora: string,
    duracao: number,
    observacoes: string = ''
  ): Promise<string> => {
    if (!fichaId || !auth.currentUser?.uid) {
      throw new Error('Dados incompletos');
    }
    if (duracao <= 0) {
      throw new Error('Duração deve ser maior que 0');
    }

    const docRef = await addDoc(treinosCollectionRef, {
      fichaId,
      fichaNome,
      dataRealizacao,
      hora,
      duracao,
      observacoes,
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  },

  // Deletar treino
  deletar: async (treinoId: string): Promise<void> => {
    const treinoDocRef = doc(db, 'TreinosRealizados', treinoId);
    await deleteDoc(treinoDocRef);
  },
};
