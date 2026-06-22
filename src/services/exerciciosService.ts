import { db, auth } from '../config/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

const exerciciosCollectionRef = collection(db, 'Exercicios');

export const exerciciosService = {
  // Adicionar exercício
  criar: async (
    fichaId: string,
    nome: string,
    series: number,
    repeticoes: number,
    peso: number,
    imagemUrl: string = ''
  ): Promise<string> => {
    if (!nome.trim()) {
      throw new Error('Nome do exercício é obrigatório');
    }
    if (!fichaId || !auth.currentUser?.uid) {
      throw new Error('Dados incompletos');
    }

    const agora = new Date().toLocaleDateString('pt-BR');
    const docRef = await addDoc(exerciciosCollectionRef, {
      nome,
      series,
      repeticoes,
      peso,
      fichaId,
      userId: auth.currentUser.uid,
      dataAdicao: agora,
      imagemUrl,
    });
    return docRef.id;
  },

  // Deletar exercício
  deletar: async (exercicioId: string): Promise<void> => {
    const exercicioDocRef = doc(db, 'Exercicios', exercicioId);
    await deleteDoc(exercicioDocRef);
  },
};
