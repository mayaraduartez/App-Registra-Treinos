import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { auth, db } from '../config/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';

import { useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Exercicio } from '../types';

const IMGBB_API_KEY = 'b812566f4daf5f1dd51f5ec883b32f80';

export default function Exercicios() {
  const route = useRoute<any>();
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;

  const { fichaId, fichaNome } = route.params || {};

  const [novoExercicio, setNovoExercicio] = useState('');
  const [series, setSeries] = useState('3');
  const [repeticoes, setRepeticoes] = useState('10');
  const [peso, setPeso] = useState('');
  const [imagemUri, setImagemUri] = useState('');
  const [imagemBase64, setImagemBase64] = useState('');

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
        dataAdicao: doc.data().dataAdicao,
        imagemUrl: doc.data().imagemUrl || ''
      }));
      setExercicios(listaExercicios);
    });

    return () => unsubscribe();
  }, [fichaId, auth.currentUser?.uid]);

  const selecionarImagem = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if ('canceled' in result && result.canceled) {
      return;
    }

    const selected = Array.isArray((result as any).assets) ? (result as any).assets[0] : result;
    if (!selected?.uri) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
      return;
    }

    setImagemUri(selected.uri);
    setImagemBase64(selected.base64 || '');
  };

  const uploadImageToImgBB = async (base64Image: string) => {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error('Erro no upload da imagem');
    }

    return data.data.url;
  };

  const adicionarExercicio = async () => {
    if (novoExercicio.trim() === '') {
      Alert.alert('Digite o nome do exercício');
      return;
    }

    if (!fichaId || !auth.currentUser?.uid) {
      Alert.alert('Erro', 'Não foi possível identificar a ficha atual.');
      return;
    }

    const seriesNumero = Number(series);
    const repeticoesNumero = Number(repeticoes);
    const pesoNumero = peso ? Number(peso) : 0;

    if (Number.isNaN(seriesNumero) || Number.isNaN(repeticoesNumero) || seriesNumero <= 0 || repeticoesNumero <= 0) {
      Alert.alert('Erro', 'Informe séries e repetições válidas.');
      return;
    }

    try {
      setLoading(true);
      const agora = new Date().toLocaleDateString('pt-BR');
      let imagemUrl = '';

      if (imagemBase64) {
        if (!IMGBB_API_KEY || IMGBB_API_KEY.includes('COLOQUE_SUA_CHAVE_IMGBB_AQUI')) {
          Alert.alert(
            'Chave ImgBB não configurada',
            'O exercício será salvo, mas a imagem não será enviada para ImgBB até que você adicione a chave.'
          );
          imagemUrl = imagemUri;
        } else {
          imagemUrl = await uploadImageToImgBB(imagemBase64);
        }
      } else if (imagemUri) {
        imagemUrl = imagemUri;
      }

      await addDoc(exerciciosCollectionRef, {
        nome: novoExercicio,
        series: seriesNumero,
        repeticoes: repeticoesNumero,
        peso: pesoNumero,
        fichaId: fichaId,
        userId: auth.currentUser.uid,
        dataAdicao: agora,
        imagemUrl: imagemUrl
      });
      setNovoExercicio('');
      setSeries('3');
      setRepeticoes('10');
      setPeso('');
      setImagemUri('');
      setImagemBase64('');
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
      <Text style={styles.fichaNomeTitle}>⚡ {fichaNome}</Text>
      <Text style={styles.subtitle}>Exercícios da Ficha</Text>

      <TouchableOpacity 
        style={styles.buttonAdd}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonAddText}>+ Adicionar Exercício</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 20 }} />}

      <FlatList
        data={exercicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.exercicioItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exercicioNome}>{item.nome}</Text>
              {item.imagemUrl ? (
                <Image source={{ uri: item.imagemUrl }} style={styles.exercicioImage} />
              ) : null}
              <View style={styles.detalhesRow}>
                <Text style={styles.detalhe}>🔙 {item.series}x{item.repeticoes}</Text>
                {item.peso ? (
  <Text style={styles.detalhe}>⚖️ {item.peso}kg</Text>
) : null}
              </View>
              <Text style={styles.dataAdicao}>📅 {item.dataAdicao}</Text>
            </View>

            <TouchableOpacity
              style={styles.btnDeletar}
              onPress={() => deletarExercicio(item.id)}
              activeOpacity={0.7}
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
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🔥 Novo Exercício</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do exercício (ex: Supino)"
              value={novoExercicio}
              onChangeText={setNovoExercicio}
              placeholderTextColor="#A1A1A6"
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Séries 💪</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="3"
                  value={series}
                  onChangeText={setSeries}
                  keyboardType="numeric"
                  placeholderTextColor="#A1A1A6"
                />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Repetições 🔛</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="10"
                  value={repeticoes}
                  onChangeText={setRepeticoes}
                  keyboardType="numeric"
                  placeholderTextColor="#A1A1A6"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Peso ⚡</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="20"
                  value={peso}
                  onChangeText={setPeso}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#A1A1A6"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.imageButton} onPress={selecionarImagem} activeOpacity={0.8}>
              <Text style={styles.imageButtonText}>{imagemUri ? '🖼️ Alterar foto' : '🖼️ Adicionar foto'}</Text>
            </TouchableOpacity>
            {imagemUri ? (
              <Image source={{ uri: imagemUri }} style={styles.previewImage} />
            ) : null}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.buttonCancel}
                onPress={() => {
                  setModalVisible(false);
                  setImagemUri('');
                  setImagemBase64('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buttonCreate}
                onPress={adicionarExercicio}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonCreateText}>Adicionar</Text>
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
    backgroundColor: '#FFF4E6'
  },
  fichaNomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500'
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
  exercicioItem: {
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
    borderLeftColor: '#F59E0B',
  },
  exercicioNome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  detalhesRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 16,
  },
  detalhe: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  exercicioImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 16,
  },
  imageButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  dataAdicao: {
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '90%',
    maxHeight: '90%',
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
    backgroundColor: '#FFFAF0',
    width: '100%',
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500'
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  smallInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFAF0',
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500'
  },
  rowInputs: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  }
});
