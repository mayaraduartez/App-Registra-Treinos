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
  serverTimestamp,
} from 'firebase/firestore';
import { TreinoRealizado, Estatisticas } from '../types';

export function useTreinosRealizados() {
  const [treinos, setTreinos] = useState<TreinoRealizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treinosCollectionRef = collection(db, 'TreinosRealizados');

  // Carregar treinos realizados
  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setTreinos([]);
      return;
    }

    const qTreinos = query(
      treinosCollectionRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      qTreinos,
      (snapshot) => {
        const listaTreinos = snapshot.docs.map((doc) => ({
          id: doc.id,
          fichaId: doc.data().fichaId,
          fichaNome: doc.data().fichaNome,
          dataRealizacao: doc.data().dataRealizacao,
          hora: doc.data().hora,
          duracao: doc.data().duracao,
          observacoes: doc.data().observacoes,
          userId: doc.data().userId,
        }));

        // Ordenar por data mais recente
        listaTreinos.sort((a, b) => {
          return (
            new Date(b.dataRealizacao).getTime() -
            new Date(a.dataRealizacao).getTime()
          );
        });

        setTreinos(listaTreinos);
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // Registrar treino
  const registrarTreino = async (
    fichaId: string,
    fichaNome: string,
    dataRealizacao: string,
    hora: string,
    duracao: number,
    observacoes: string = ''
  ) => {
    if (!fichaId || !auth.currentUser?.uid) {
      throw new Error('Dados incompletos');
    }
    if (duracao <= 0) {
      throw new Error('Duração deve ser maior que 0');
    }

    try {
      setLoading(true);
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar treino
  const deletarTreino = async (id: string) => {
    try {
      setLoading(true);
      const treinoDocRef = doc(db, 'TreinosRealizados', id);
      await deleteDoc(treinoDocRef);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = (): Estatisticas => {
    const totalTreinos = treinos.length;
    const totalHoras = treinos.reduce((acc, t) => acc + parseInt(t.duracao?.toString() || '0'), 0);
    const fichasUnicas = new Set(treinos.map((t) => t.fichaId)).size;

    return {
      totalTreinos,
      totalHoras,
      fichasUnicas,
    };
  };

  return {
    treinos,
    loading,
    error,
    registrarTreino,
    deletarTreino,
    calcularEstatisticas,
  };
}
