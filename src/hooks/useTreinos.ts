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
} from 'firebase/firestore';
import { Exercicio } from '../types';

export function useExercicios(fichaId: string) {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exerciciosCollectionRef = collection(db, 'Exercicios');

  // Carregar exercícios da ficha
  useEffect(() => {
    if (!fichaId || !auth.currentUser?.uid) {
      setExercicios([]);
      return;
    }

    const qExercicios = query(
      exerciciosCollectionRef,
      where('fichaId', '==', fichaId),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      qExercicios,
      (snapshot) => {
        const listaExercicios = snapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          series: doc.data().series,
          repeticoes: doc.data().repeticoes,
          peso: doc.data().peso,
          dataAdicao: doc.data().dataAdicao,
          imagemUrl: doc.data().imagemUrl || '',
          fichaId: doc.data().fichaId,
          userId: doc.data().userId,
        }));
        setExercicios(listaExercicios);
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [fichaId, auth.currentUser?.uid]);

  // Adicionar exercício
  const adicionarExercicio = async (
    nome: string,
    series: number,
    repeticoes: number,
    peso: number,
    imagemUrl: string = ''
  ) => {
    if (!nome.trim()) {
      throw new Error('Nome do exercício é obrigatório');
    }
    if (!fichaId || !auth.currentUser?.uid) {
      throw new Error('Dados incompletos');
    }

    try {
      setLoading(true);
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar exercício
  const deletarExercicio = async (id: string) => {
    try {
      setLoading(true);
      const exercicioDocRef = doc(db, 'Exercicios', id);
      await deleteDoc(exercicioDocRef);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    exercicios,
    loading,
    error,
    adicionarExercicio,
    deletarExercicio,
  };
}
