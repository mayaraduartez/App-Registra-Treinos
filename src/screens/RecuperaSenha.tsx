import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, TouchableOpacity } from 'react-native';

import { auth } from '../config/firebase'; 

import { sendPasswordResetEmail } from 'firebase/auth'; 

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

// Tipagem da navegação
type RecoverScreenProp = NativeStackNavigationProp<RootStackParamList, 'RecuperaSenha'>;

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<RecoverScreenProp>();

  const recuperarSenha = () => {
    if (email === '') {
      Alert.alert("Atenção", "Por favor, digite seu e-mail.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Sucesso!", "Link enviado! Verifique sua caixa de entrada e o Spam.");
        navigation.goBack();
      })
      .catch((erro) => {
        Alert.alert("Erro", erro.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Recuperar Senha</Text>
      <Text style={styles.subtitle}>Enviaremos um link para seu e-mail</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder='E-mail cadastrado' 
        autoCapitalize="none" 
        keyboardType="email-address" 
        onChangeText={setEmail} 
        value={email}
        placeholderTextColor="#A1A1A6"
      />
      
      <TouchableOpacity style={styles.buttonPrimary} onPress={recuperarSenha} activeOpacity={0.8}>
        <Text style={styles.buttonPrimaryText}>Enviar Link de Recuperação</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.buttonSecondary}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonSecondaryText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center',
    backgroundColor: '#FFF4E6'
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
    backgroundColor: '#FFFAF0',
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
    marginBottom: 12,
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
