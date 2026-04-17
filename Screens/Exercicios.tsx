import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { auth, db } from '../firebase'; 
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';

import { useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type Exercicio = {
  id: string;
  nome: string;
  series: string;
  repeticoes: string;
  peso: string;
  dataAdicao: string;
}

export default function Exercicios() {
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;
  
  const { fichaId, fichaNome } = route.params || {};

  const [novoExercicio, setNovoExercicio] = useState('');
  const [series, setSeries] = useState('3');
  const [repeticoes, setRepeticoes] = useState('10');
  const [peso, setPeso] = useState('');
  
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const exerciciosCollectionRef = collection(db, "Exercicios");

  useEffect(() => {
    if (!fichaId) return;

    const qExercicios = query(
      exerciciosCollectionRef, 
      where("fichaId", "==", fichaId),
      where("userId", "==", auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(qExercicios, (snapshot) => {
      const listaExercicios = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        series: doc.data().series,
        repeticoes: doc.data().repeticoes,
        peso: doc.data().peso,
        dataAdicao: doc.data().dataAdicao
      }));
      setExercicios(listaExercicios);
    });

    return () => unsubscribe();
  }, [fichaId, auth.currentUser?.uid]);

  const adicionarExercicio = async () => {
    if (novoExercicio.trim() === '') {
      Alert.alert('Digite o nome do exercício');
      return;
    }
    try {
      setLoading(true);
      const agora = new Date().toLocaleDateString('pt-BR');
      await addDoc(exerciciosCollectionRef, {
        nome: novoExercicio,
        series: series,
        repeticoes: repeticoes,
        peso: peso,
        fichaId: fichaId,
        userId: auth.currentUser?.uid,
        dataAdicao: agora
      });
      setNovoExercicio('');
      setSeries('3');
      setRepeticoes('10');
      setPeso('');
      setModalVisible(false);
      Alert.alert('Sucesso!', 'Exercício adicionado!');
    } catch (error) {
      console.error("Erro ao adicionar exercício: ", error);
      Alert.alert('Erro', 'Não foi possível adicionar o exercício');
    } finally {
      setLoading(false);
    }
  };

  const deletarExercicio = async (id: string) => {
    try {
      setLoading(true);
      const exercicioDocRef = doc(db, "Exercicios", id);
      await deleteDoc(exercicioDocRef);
      Alert.alert('Sucesso!', 'Exercício deletado!');
    } catch (error) {
      console.error("Erro ao deletar: ", error);
      Alert.alert('Erro', 'Não foi possível deletar o exercício');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.fichaNomeTitle}>🏋️ {fichaNome}</Text>
      <Text style={styles.subtitle}>Exercícios da Ficha</Text>

      <Button 
        title="+ Adicionar Exercício" 
        onPress={() => setModalVisible(true)} 
        color="#28A745" 
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      <FlatList 
        data={exercicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.exercicioItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exercicioNome}>{item.nome}</Text>
              <View style={styles.detalhesRow}>
                <Text style={styles.detalhe}>📊 {item.series}x{item.repeticoes}</Text>
                {item.peso && <Text style={styles.detalhe}>⚖️ {item.peso}kg</Text>}
              </View>
              <Text style={styles.dataAdicao}>Adicionado em: {item.dataAdicao}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.btnDeletar}
              onPress={() => deletarExercicio(item.id)}
            >
              <Text style={styles.btnDeletarTexto}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: '100%', marginTop: 20, marginBottom: tabBarHeight + 10 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum exercício nesta ficha!</Text>
            <Text style={styles.emptySubtext}>Toque em "+ Adicionar Exercício"</Text>
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
            <Text style={styles.modalTitle}>Novo Exercício</Text>
            
            <TextInput 
              style={styles.input}
              placeholder="Nome do exercício (ex: Supino)"
              value={novoExercicio}
              onChangeText={setNovoExercicio}
              placeholderTextColor="#999"
            />
            
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Séries</Text>
                <TextInput 
                  style={styles.smallInput}
                  placeholder="3"
                  value={series}
                  onChangeText={setSeries}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Repetições</Text>
                <TextInput 
                  style={styles.smallInput}
                  placeholder="10"
                  value={repeticoes}
                  onChangeText={setRepeticoes}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput 
                  style={styles.smallInput}
                  placeholder="20"
                  value={peso}
                  onChangeText={setPeso}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.modalButtonContainer}>
              <Button 
                title="Cancelar" 
                onPress={() => setModalVisible(false)} 
                color="#FF3B30"
              />
              <Button 
                title="Adicionar" 
                onPress={adicionarExercicio} 
                color="#28A745"
                disabled={loading}
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
  fichaNomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  exercicioItem: {
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
    borderLeftColor: '#FF9500',
  },
  exercicioNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detalhesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detalhe: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  dataAdicao: {
    fontSize: 12,
    color: '#999',
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    width: '100%',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
});
