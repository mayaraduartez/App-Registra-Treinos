import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { auth, db } from '../config/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { TreinoRealizado } from '../types';

export default function Historico() {
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;

  const [treinosRealizados, setTreinosRealizados] = useState<TreinoRealizado[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fichas, setFichas] = useState<any[]>([]);
  const [fichaSelected, setFichaSelected] = useState('');
  const [duracao, setDuracao] = useState('45');
  const [observacoes, setObservacoes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const teinosCollectionRef = collection(db, "TreinosRealizados");
  const fichasCollectionRef = collection(db, "FichasDeTreino");

  //carrega as fichas
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const qFichas = query(
      fichasCollectionRef, where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qFichas, (snapshot) => {
      const listaFichas = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome
      }));
      setFichas(listaFichas);
    });
    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  //carrega treinos realizados
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const qTreinos = query(
      teinosCollectionRef, where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qTreinos, (snapshot) => {
      const listaTreinos = snapshot.docs.map((doc) => ({
        id: doc.id,
        fichaId: doc.data().fichaId,
        fichaNome: doc.data().fichaNome,
        dataRealizacao: doc.data().dataRealizacao,
        hora: doc.data().hora,
        duracao: doc.data().duracao,
        observacoes: doc.data().observacoes,
      }));
      // Ordenar por data mais recente
      listaTreinos.sort((a, b) => {
        return new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime();
      });
      setTreinosRealizados(listaTreinos);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      setShowDatePicker(false);
    }
  };

  const registrarTreino = async () => {
    if (!fichaSelected) {
      Alert.alert('Selecione uma ficha');
      return;
    }
    try {
      setLoading(true);
      const nomeFicha = fichas.find(f => f.id === fichaSelected)?.nome;
      const dataStr = date.toLocaleDateString('pt-BR');
      const horaStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const duracaoNumero = Number(duracao);
      if (Number.isNaN(duracaoNumero) || duracaoNumero <= 0) {
        Alert.alert('Erro', 'Informe uma duração válida em minutos.');
        return;
      }

      await addDoc(teinosCollectionRef, {
        fichaId: fichaSelected,
        fichaNome: nomeFicha,
        dataRealizacao: dataStr,
        hora: horaStr,
        duracao: duracaoNumero,
        observacoes: observacoes,
        userId: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });

      setFichaSelected('');
      setDuracao('45');
      setObservacoes('');
      setDate(new Date());
      setModalVisible(false);
      Alert.alert('Sucesso!', 'Treino registrado!');
    } catch (error) {
      console.error("Erro ao registrar treino: ", error);
      Alert.alert('Erro', 'Não foi possível registrar o treino');
    } finally {
      setLoading(false);
    }
  };

  const deletarTreino = async (id: string) => {
    try {
      setLoading(true);
      const treinoDocRef = doc(db, "TreinosRealizados", id);
      await deleteDoc(treinoDocRef);
      Alert.alert('Sucesso!', 'Treino removido do histórico!');
    } catch (error) {
      console.error("Erro ao deletar: ", error);
      Alert.alert('Erro', 'Não foi possível deletar');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = () => {
    const totalTreinos = treinosRealizados.length;
    const totalHoras = treinosRealizados.reduce((acc, t) => acc + parseInt(t.duracao || '0'), 0);
    const fichasUniqueras = new Set(treinosRealizados.map(t => t.fichaId)).size;

    return { totalTreinos, totalHoras, fichasUnicas: fichasUniqueras };
  };

  const stats = calcularEstatisticas();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Histórico de Treinos</Text>


      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTreinos}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalHoras}</Text>
          <Text style={styles.statLabel}>Minutos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.fichasUnicas}</Text>
          <Text style={styles.statLabel}>Fichas</Text>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.buttonAdd}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonAddText}>+ Registrar Treino</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 20 }} />}

      <FlatList
        data={treinosRealizados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.treinoItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fichaNome}>{item.fichaNome}</Text>
              <View style={styles.detalhesRow}>
                <Text style={styles.detalhe}>📅 {item.dataRealizacao}</Text>
                <Text style={styles.detalhe}>🕐 {item.hora}</Text>
              </View>
              <Text style={styles.detalhe}>⏳ Duração: {item.duracao} min</Text>
              {item.observacoes && (
                <Text style={styles.observacoes}>📝 {item.observacoes}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.btnDeletar}
              onPress={() => deletarTreino(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDeletarTexto}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: '100%', marginTop: 15, marginBottom: tabBarHeight + 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum treino registrado!</Text>
            <Text style={styles.emptySubtext}>Comece a registrar seus treinos</Text>
          </View>
        }
      />


      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🎯 Registrar Treino</Text>

            <Text style={styles.label}>Ficha de Treino 💪</Text>
            <ScrollView style={styles.fichaList}>
              {fichas.map((ficha) => (
                <TouchableOpacity
                  key={ficha.id}
                  style={[
                    styles.fichaOption,
                    fichaSelected === ficha.id && styles.fichaOptionSelected
                  ]}
                  onPress={() => setFichaSelected(ficha.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.fichaOptionText,
                    fichaSelected === ficha.id && styles.fichaOptionTextSelected
                  ]}>
                    {ficha.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Data e Hora 📅</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateButtonText}>📅 {date.toLocaleDateString('pt-BR')} - ⏰ {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>Duração ⏱️</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity 
                style={styles.durationButtonMinus}
                onPress={() => setDuracao(Math.max(5, parseInt(duracao) - 5).toString())}
              >
                <Text style={styles.durationButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.durationValue}>{duracao} min</Text>
              <TouchableOpacity 
                style={styles.durationButtonPlus}
                onPress={() => setDuracao((parseInt(duracao) + 5).toString())}
              >
                <Text style={styles.durationButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Observações 📄</Text>
            <TouchableOpacity>
              <Text style={styles.observacoesInput}>Adicionar notas sobre o treino...</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.buttonCancel}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonCreate, !fichaSelected && { opacity: 0.6 }]}
                onPress={registrarTreino}
                disabled={loading || !fichaSelected}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCreateText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E6F3FF'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    marginTop: 10,
  },
  statsContainer: {
    marginBottom: 24,
    height: 110,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6'
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '600'
  },
  buttonAdd: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  treinoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6',
  },
  fichaNome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  detalhesRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  detalhe: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  observacoes: {
    fontSize: 12,
    color: '#A1A1A6',
    fontWeight: '500',
    marginTop: 8,
  },
  btnDeletar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnDeletarTexto: {
    fontSize: 18,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A1A1A6',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '500'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '90%',
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1F2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 12,
  },
  fichaList: {
    maxHeight: 100,
    marginBottom: 16,
  },
  fichaOption: {
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
  },
  fichaOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  fichaOptionText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500'
  },
  fichaOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateButton: {
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  dateButtonText: {
    color: '#0369A1',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  durationButtonMinus: {
    backgroundColor: '#FEE2E2',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  durationButtonPlus: {
    backgroundColor: '#DBEAFE',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  durationButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'center',
  },
  observacoesInput: {
    minHeight: 36,
    marginBottom: 16,
    color: '#A1A1A6',
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  buttonCancelText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonCreate: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonCreateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  }
});
