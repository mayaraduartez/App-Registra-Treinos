import { db, auth } from '../config/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { FichaDeTreino } from '../types';

const fichasCollectionRef = collection(db, 'FichasDeTreino');
const exerciciosCollectionRef = collection(db, 'Exercicios');

export const fichasService = {
  // Adicionar nova ficha
  criar: async (nome: string, descricao: string): Promise<string> => {
    if (!nome.trim()) {
      throw new Error('Nome da ficha é obrigatório');
    }
    if (!auth.currentUser?.uid) {
      throw new Error('Usuário não autenticado');
    }

    const agora = new Date().toLocaleDateString('pt-BR');
    const docRef = await addDoc(fichasCollectionRef, {
      nome,
      descricao,
      userId: auth.currentUser.uid,
      dataCriacao: agora,
    });
    return docRef.id;
  },

  // Deletar ficha
  deletar: async (fichaId: string): Promise<void> => {
    if (!auth.currentUser?.uid) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se tem exercícios
    const qExerciciosDaFicha = query(
      exerciciosCollectionRef,
      where('fichaId', '==', fichaId)
    );
    const snapshotExercicios = await getDocs(qExerciciosDaFicha);

    if (!snapshotExercicios.empty) {
      throw new Error(
        'Não é possível deletar ficha com exercícios. Exclua os exercícios primeiro.'
      );
    }

    const fichaDocRef = doc(db, 'FichasDeTreino', fichaId);
    await deleteDoc(fichaDocRef);
  },
};
