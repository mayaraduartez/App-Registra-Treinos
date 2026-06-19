import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';

import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

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
      <Text style={styles.title}>📝 Criar Conta</Text>
      <Text style={styles.subtitle}>Comece sua jornada fitness</Text>

      <TextInput
        style={styles.input}
        placeholder='E-mail'
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
        editable={!loading}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder='Senha (mín. 6 caracteres)'
        secureTextEntry
        onChangeText={setSenha}
        value={senha}
        editable={!loading}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder='Confirmar Senha'
        secureTextEntry
        onChangeText={setConfirmSenha}
        value={confirmSenha}
        editable={!loading}
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button title='Cadastrar' onPress={cadastrar} color="#28A745" />

          <View style={{ marginTop: 20 }}>
            <Button title='Voltar ao Login' onPress={() => navigation.goBack()} color="#666" />
          </View>
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
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 14,
  }
});