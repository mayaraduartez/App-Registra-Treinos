import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';

import { auth } from '../firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth'; 

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<LoginScreenProp>();

  const logar = () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        setLoading(false);
        navigation.replace('MainTabs');
      })
      .catch((erro) => {
        setLoading(false);
        Alert.alert("Erro", erro.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Registro de Treinos</Text>
      <Text style={styles.subtitle}></Text>
      
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
        placeholder='Senha' 
        secureTextEntry 
        onChangeText={setSenha} 
        value={senha}
        editable={!loading}
        placeholderTextColor="#999"
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Button title='Entrar' onPress={logar} />
          
          <View style={{ marginTop: 20 }}>
            <Button title='Criar conta' onPress={() => navigation.navigate('Register')} color="#007BFF" />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button 
              title='Esqueceu a senha?' 
              onPress={() => navigation.navigate('RecuperaSenha')} 
              color="#FF9500"
            />
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
    fontSize: 32, 
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