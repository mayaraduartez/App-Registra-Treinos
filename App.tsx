import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './Screens/Login';
import Home from './Screens/Home';
import Register from './Screens/Register';
import RecuperaSenha from './Screens/RecuperaSenha';
import Exercicios from './Screens/Exercicios';
import Historico from './Screens/Historico';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  RecuperaSenha: undefined;
  MainTabs: undefined;
};

export type FichasStackParamList = {
  Fichas: undefined;
  Exercicios: { fichaId: string; fichaNome: string };
};

export type TabParamList = {
  FichasTab: undefined;
  Historico: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const FichasStack = createNativeStackNavigator<FichasStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function FichasNavigator() {
  return (
    <FichasStack.Navigator screenOptions={{ headerShown: false }}>
      <FichasStack.Screen name="Fichas" component={Home} />
      <FichasStack.Screen 
        name="Exercicios" 
        component={Exercicios}
        options={{
          title: 'Exercícios',
          headerShown: true,
          headerBackTitle: 'Voltar'
        }}
      />
    </FichasStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
          borderTopWidth: 1,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomColor: '#ddd',
          borderBottomWidth: 1,
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="FichasTab" 
        component={FichasNavigator}
        options={{
          title: 'Minhas Fichas',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Historico" 
        component={Historico}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="RecuperaSenha" component={RecuperaSenha} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}