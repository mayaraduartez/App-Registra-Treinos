import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type TreinoRealizado = {
  id: string;
  fichaId: string;
  fichaNome: string;
  dataRealizacao: string;
  hora: string;
  duracao: string;
  observacoes: string;
}

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
      <Text style={styles.title}>📅 Histórico de Treinos</Text>


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

      <Button
        title="+ Registrar Treino"
        onPress={() => setModalVisible(true)}
        color="#28A745"
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      <FlatList
        data={treinosRealizados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.treinoItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fichaNome}>{item.fichaNome}</Text>
              <View style={styles.detalhesRow}>
                <Text style={styles.detalhe}>📅 {item.dataRealizacao}</Text>
                <Text style={styles.detalhe}>⏰ {item.hora}</Text>
              </View>
              <Text style={styles.detalhe}>⏱️ Duração: {item.duracao} min</Text>
              {item.observacoes && (
                <Text style={styles.observacoes}>📝 {item.observacoes}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.btnDeletar}
              onPress={() => deletarTreino(item.id)}
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
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Registrar Treino</Text>

            <Text style={styles.label}>Ficha de Treino</Text>
            <ScrollView style={styles.fichaList}>
              {fichas.map((ficha) => (
                <TouchableOpacity
                  key={ficha.id}
                  style={[
                    styles.fichaOption,
                    fichaSelected === ficha.id && styles.fichaOptionSelected
                  ]}
                  onPress={() => setFichaSelected(ficha.id)}
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

            <Text style={styles.label}>Data</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{date.toLocaleDateString('pt-BR')} - {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>Duração (minutos)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity onPress={() => setDuracao(Math.max(5, parseInt(duracao) - 5).toString())}>
                <Text style={styles.durationButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.durationValue}>{duracao} min</Text>
              <TouchableOpacity onPress={() => setDuracao((parseInt(duracao) + 5).toString())}>
                <Text style={styles.durationButton}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Observações (opcional)</Text>
            <View style={styles.observacoesInput}>

            </View>

            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                color="#FF3B30"
              />
              <Button
                title="Registrar"
                onPress={registrarTreino}
                color="#28A745"
                disabled={loading || !fichaSelected}
              />
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
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  statsContainer: {
    marginBottom: 20,
    height: 120,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28A745',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  treinoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  fichaNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detalhesRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detalhe: {
    fontSize: 13,
    color: '#666',
    marginRight: 15,
  },
  observacoes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  btnDeletar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  btnDeletarTexto: {
    fontSize: 20,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  fichaList: {
    maxHeight: 80,
    marginBottom: 15,
  },
  fichaOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#f9f9f9',
  },
  fichaOptionSelected: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  fichaOptionText: {
    color: '#333',
    fontSize: 14,
  },
  fichaOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  durationButton: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28A745',
    paddingHorizontal: 20,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  observacoesInput: {
    minHeight: 30,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
});
