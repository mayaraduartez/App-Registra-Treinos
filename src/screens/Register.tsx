import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';

import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function Register() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<RegisterScreenProp>();

  const cadastrar = () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha e-mail e senha');
      return;
    }
    if (senha !== confirmSenha) {
      Alert.alert('Erro', 'As senhas não correspondem');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, email, senha)
      .then(() => {
        setLoading(false);
        Alert.alert("Sucesso!", "Conta criada! Bem-vindo ao FitTrack!");
      })
      .catch((erro) => {
        setLoading(false);
        Alert.alert("Erro", erro.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Criar Conta</Text>
      <Text style={styles.subtitle}>Comece sua jornada fitness</Text>

      <TextInput
        style={styles.input}
        placeholder='E-mail'
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
        editable={!loading}
        placeholderTextColor="#A1A1A6"
      />

      <TextInput
        style={styles.input}
        placeholder='Senha (mín. 6 caracteres)'
        secureTextEntry
        onChangeText={setSenha}
        value={senha}
        editable={!loading}
        placeholderTextColor="#A1A1A6"
      />

      <TextInput
        style={styles.input}
        placeholder='Confirmar Senha'
        secureTextEntry
        onChangeText={setConfirmSenha}
        value={confirmSenha}
        editable={!loading}
        placeholderTextColor="#A1A1A6"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.buttonPrimary} onPress={cadastrar} activeOpacity={0.8}>
            <Text style={styles.buttonPrimaryText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonSecondaryText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#E6F3FF'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    fontSize: 16,
    color: '#1F2937',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  buttonPrimary: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#E8DFF5',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  buttonSecondaryText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  }
});
