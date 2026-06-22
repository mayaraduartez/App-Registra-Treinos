import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

export const authService = {
  // Login
  login: async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('E-mail e senha são obrigatórios');
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Registrar novo usuário
  register: async (email: string, password: string, confirmPassword: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('E-mail e senha são obrigatórios');
    }
    if (password !== confirmPassword) {
      throw new Error('As senhas não correspondem');
    }
    if (password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Recuperar senha
  resetPassword: async (email: string) => {
    if (!email.trim()) {
      throw new Error('E-mail é obrigatório');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Fazer logout
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter usuário atual
  getCurrentUser: () => {
    return auth.currentUser;
  },
};
