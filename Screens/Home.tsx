import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';

import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth'; 

import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FichasStackParamList } from '../App';

type FichasNavigationProp = NativeStackNavigationProp<FichasStackParamList, 'Fichas'>;

type FichaDeTreino = {
  id: string;
  nome: string;
  descricao: string;
  dataCriacao: string;
}

export default function FichasDeTreino() {
  const navigation = useNavigation<FichasNavigationProp>();
  const tabBarHeight = useBottomTabBarHeight();

  const [novaFicha, setNovaFicha] = useState('');
  const [descricaoFicha, setDescricaoFicha] = useState('');
  const [fichas, setFichas] = useState<FichaDeTreino[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const fichasCollectionRef = collection(db, "FichasDeTreino");


  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const qFichas = query(
      fichasCollectionRef, where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qFichas, (snapshot) => {
      const listaFichas = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        descricao: doc.data().descricao,
        dataCriacao: doc.data().dataCriacao
      }));
      setFichas(listaFichas);
    });
    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const adicionarFicha = async () => {
    if (novaFicha.trim() === '') {
      Alert.alert('Digite um nome para a ficha');
      return;
    }
    try {
      setLoading(true);
      const agora = new Date().toLocaleDateString('pt-BR');
      await addDoc(fichasCollectionRef, {
        nome: novaFicha,
        descricao: descricaoFicha,
        userId: auth.currentUser?.uid,
        dataCriacao: agora
      });
      setNovaFicha('');
      setDescricaoFicha('');
      setModalVisible(false);
      Alert.alert('Sucesso!', 'Ficha criada com sucesso!');
    } catch (error) {
      console.error("Erro ao adicionar ficha: ", error);
      Alert.alert('Erro', 'Não foi possível criar a ficha');
    } finally {
      setLoading(false);
    }
  };

  const deletarFicha = async (id: string) => {
    try {
      const exerciciosRef = collection(db, "Exercicios");
      const qExerciciosDaFicha = query(
        exerciciosRef, 
        where("fichaId", "==", id)
      );

      const snapshotExercicios = await getDocs(qExerciciosDaFicha);

      if (!snapshotExercicios.empty) {
        Alert.alert(
          "Ação Bloqueada 🚫", 
          "Você não pode excluir esta ficha porque ela ainda possui exercícios. Exclua os exercícios primeiro!"
        );
        return;
      }
      
      setLoading(true);
      const fichaDocRef = doc(db, "FichasDeTreino", id);
      await deleteDoc(fichaDocRef);
      Alert.alert('Sucesso!', 'Ficha deletada!');
    } catch (error) {
      console.error("Erro ao deletar ficha: ", error);
      Alert.alert('Erro', 'Não foi possível deletar a ficha');
    } finally {
      setLoading(false);
    }
  };

  const deslogar = () => {
    signOut(auth).then(() => {
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emailText}>Logado como: {auth.currentUser?.email}</Text>

      <Text style={styles.title}>📋 Minhas Fichas de Treino</Text>
      
      <Button 
        title="+ Nova Ficha" 
        onPress={() => setModalVisible(true)} 
        color="#28A745" 
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      <FlatList 
        data={fichas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.fichaItem}>
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('Exercicios', { fichaId: item.id, fichaNome: item.nome })}
            >
              <Text style={styles.fichaNome}>{item.nome}</Text>
              <Text style={styles.fichaDescricao}>{item.descricao}</Text>
              <Text style={styles.fichaData}>Criada em: {item.dataCriacao}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.btnDeletar}
              onPress={() => deletarFicha(item.id)}
            >
              <Text style={styles.btnDeletarTexto}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: '100%', marginTop: 20, marginBottom: tabBarHeight }}
      />


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Nova Ficha de Treino</Text>
            
            <TextInput 
              style={styles.input}
              placeholder="Nome da ficha (ex: Treino A - Peito)"
              value={novaFicha}
              onChangeText={setNovaFicha}
              placeholderTextColor="#999"
            />
            
            <TextInput 
              style={[styles.input, { height: 80 }]}
              placeholder="Descrição (opcional)"
              value={descricaoFicha}
              onChangeText={setDescricaoFicha}
              multiline
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtonContainer}>
              <Button 
                title="Cancelar" 
                onPress={() => setModalVisible(false)} 
                color="#FF3B30"
              />
              <Button 
                title="Criar" 
                onPress={adicionarFicha} 
                color="#28A745"
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Button title="Sair (Logout)" onPress={deslogar} color="#FF3B30" />
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
    marginTop: 10, 
    marginBottom: 15, 
    fontWeight: 'bold',
    color: '#333'
  },
  emailText: { 
    fontSize: 12, 
    marginBottom: 20, 
    color: '#666',
    fontStyle: 'italic'
  },
  fichaItem: { 
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
    borderLeftColor: '#007BFF'
  },
  fichaNome: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  fichaDescricao: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 8
  },
  fichaData: { 
    fontSize: 12, 
    color: '#999'
  },
  btnDeletar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  btnDeletarTexto: {
    fontSize: 20,
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
    width: '85%',
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
});