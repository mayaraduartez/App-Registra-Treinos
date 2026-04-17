import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';

import { auth } from '../firebase'; 

import { sendPasswordResetEmail } from 'firebase/auth'; 

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

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
      <Text style={styles.title}>Recuperar Senha</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder='E-mail cadastrado' 
        autoCapitalize="none" 
        keyboardType="email-address" 
        onChangeText={setEmail} 
        value={email} 
      />
      
      
      <Button title='Enviar Link de Recuperação' onPress={recuperarSenha} />
      
      
      <View style={{ marginTop: 20 }}>
        <Button title='Voltar' onPress={() => navigation.goBack()} color="#666" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5 }
});