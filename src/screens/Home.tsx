import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';

import { auth, db } from '../config/firebase'; 
import { signOut } from 'firebase/auth'; 

import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FichasStackParamList } from '../../App';
import { FichaDeTreino } from '../types';

type FichasNavigationProp = NativeStackNavigationProp<FichasStackParamList, 'Fichas'>;

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
      <View style={styles.header}>
        <View>
          <Text style={styles.emailText}>Logado como:</Text>
          <Text style={styles.emailValue}>{auth.currentUser?.email}</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={deslogar}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>💪 Minhas Fichas</Text>
      
      <TouchableOpacity 
        style={styles.buttonAdd}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonAddText}>+ Nova Ficha</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 20 }} />}

      <FlatList 
        data={fichas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.fichaItem}
            onPress={() => navigation.navigate('Exercicios', { fichaId: item.id, fichaNome: item.nome })}
            activeOpacity={0.7}
          >
            <View style={styles.fichaContent}>
              <Text style={styles.fichaNome}>{item.nome}</Text>
              {item.descricao && <Text style={styles.fichaDescricao}>{item.descricao}</Text>}
              <Text style={styles.fichaData}>📆 Criada: {item.dataCriacao}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.btnDeletar}
              onPress={() => deletarFicha(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDeletarTexto}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        style={{ width: '100%', marginTop: 20, marginBottom: tabBarHeight }}
      />


      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>✨ Nova Ficha de Treino</Text>
            
            <TextInput 
              style={styles.input}
              placeholder="Nome da ficha (ex: Treino A - Peito)"
              value={novaFicha}
              onChangeText={setNovaFicha}
              placeholderTextColor="#A1A1A6"
            />
            
            <TextInput 
              style={[styles.input, { height: 80 }]}
              placeholder="Descrição (opcional)"
              value={descricaoFicha}
              onChangeText={setDescricaoFicha}
              multiline
              placeholderTextColor="#A1A1A6"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.buttonCancel}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buttonCreate}
                onPress={adicionarFicha}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCreateText}>Criar</Text>
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
    backgroundColor: '#F0E7FF' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  emailText: { 
    fontSize: 12, 
    color: '#A1A1A6',
    fontWeight: '500'
  },
  emailValue: { 
    fontSize: 13, 
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  title: { 
    fontSize: 28, 
    marginBottom: 20, 
    fontWeight: '700',
    color: '#1F2937'
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
  fichaItem: { 
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
    borderLeftColor: '#8B5CF6'
  },
  fichaContent: {
    flex: 1,
  },
  fichaNome: { 
    fontSize: 17, 
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6
  },
  fichaDescricao: { 
    fontSize: 14, 
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500'
  },
  fichaData: { 
    fontSize: 12, 
    color: '#A1A1A6',
    fontWeight: '500'
  },
  btnDeletar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnDeletarTexto: {
    fontSize: 18,
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1F2937',
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB',
    padding: 14, 
    marginBottom: 16, 
    borderRadius: 10,
    backgroundColor: '#F8F5FF',
    width: '100%',
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
