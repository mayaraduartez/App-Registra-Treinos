// Cores do design system
export const COLORS = {
  // Cores principais
  primary: '#8B5CF6',      // Roxo
  secondary: '#3B82F6',    // Azul
  accent: '#F59E0B',       // Laranja
  
  // Cores de feedback
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Laranja
  error: '#DC2626',        // Vermelho
  info: '#0EA5E9',         // Cyan
  
  // Cores neutras
  dark: '#1F2937',         // Cinza escuro
  light: '#F3F4F6',        // Cinza claro
  gray: '#6B7280',         // Cinza médio
  gray100: '#F9FAFB',
  gray200: '#F3F4F6',
  gray300: '#E5E7EB',
  gray400: '#D1D5DB',
  gray500: '#A1A1A6',
  gray600: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  
  // Backgrounds por seção
  backgrounds: {
    home: '#F0E7FF',       // Roxo claro (Fichas)
    exercises: '#FFF4E6',  // Laranja claro (Exercicios)
    history: '#E6F3FF',    // Azul claro (Historico)
  },
  
  // Inputs backgrounds
  inputs: {
    home: '#F8F5FF',
    exercises: '#FFFAF0',
    history: '#F0F9FF',
  },
};

export const getColorForSection = (section: 'home' | 'exercises' | 'history') => {
  return COLORS.backgrounds[section];
};

export const getInputColorForSection = (section: 'home' | 'exercises' | 'history') => {
  return COLORS.inputs[section];
};
