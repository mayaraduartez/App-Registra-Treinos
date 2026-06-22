import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { FichaDeTreino } from '../types';

export function useFichas() {
  const [fichas, setFichas] = useState<FichaDeTreino[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fichasCollectionRef = collection(db, 'FichasDeTreino');

  // Carregar fichas do usuário
  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setFichas([]);
      return;
    }

    const qFichas = query(
      fichasCollectionRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      qFichas,
      (snapshot) => {
        const listaFichas = snapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          descricao: doc.data().descricao,
          dataCriacao: doc.data().dataCriacao,
          userId: doc.data().userId,
        }));
        setFichas(listaFichas);
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // Adicionar nova ficha
  const adicionarFicha = async (nome: string, descricao: string) => {
    if (!nome.trim()) {
      throw new Error('Nome da ficha é obrigatório');
    }
    if (!auth.currentUser?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      const agora = new Date().toLocaleDateString('pt-BR');
      const docRef = await addDoc(fichasCollectionRef, {
        nome,
        descricao,
        userId: auth.currentUser.uid,
        dataCriacao: agora,
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar ficha
  const deletarFicha = async (id: string) => {
    if (!auth.currentUser?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      // Verificar se tem exercícios
      const exerciciosRef = collection(db, 'Exercicios');
      const qExerciciosDaFicha = query(exerciciosRef, where('fichaId', '==', id));
      const snapshotExercicios = await getDocs(qExerciciosDaFicha);

      if (!snapshotExercicios.empty) {
        throw new Error('Não é possível deletar ficha com exercícios. Exclua os exercícios primeiro.');
      }

      const fichaDocRef = doc(db, 'FichasDeTreino', id);
      await deleteDoc(fichaDocRef);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fichas,
    loading,
    error,
    adicionarFicha,
    deletarFicha,
  };
}
