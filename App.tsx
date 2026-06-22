import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { auth } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './src/screens/Login';
import Home from './src/screens/Home';
import Register from './src/screens/Register';
import RecuperaSenha from './src/screens/RecuperaSenha';
import Exercicios from './src/screens/Exercicios';
import Historico from './src/screens/Historico';

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
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#A1A1A6',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
        headerTintColor: '#8B5CF6',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#1F2937',
        },
      })}
    >
      <Tab.Screen 
        name="FichasTab" 
        component={FichasNavigator}
        options={{
          title: 'Minhas Fichas',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📋</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Historico" 
        component={Historico}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📊</Text>,
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