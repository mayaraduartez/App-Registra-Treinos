// Validação de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de senha
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validação de nome
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Validação de número
export const isValidNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Validação de número positivo
export const isPositiveNumber = (value: any): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && num > 0;
};

// Validar email e senha
export const validateLogin = (email: string, password: string): { valid: boolean; error?: string } => {
  if (!email.trim()) {
    return { valid: false, error: 'E-mail é obrigatório' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'E-mail inválido' };
  }
  if (!password.trim()) {
    return { valid: false, error: 'Senha é obrigatória' };
  }
  return { valid: true };
};

// Validar registro
export const validateRegister = (
  email: string,
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } => {
  const loginValidation = validateLogin(email, password);
  if (!loginValidation.valid) {
    return loginValidation;
  }
  if (!isValidPassword(password)) {
    return { valid: false, error: 'Senha deve ter pelo menos 6 caracteres' };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não correspondem' };
  }
  return { valid: true };
};

// Validar ficha
export const validateFicha = (nome: string): { valid: boolean; error?: string } => {
  if (!nome.trim()) {
    return { valid: false, error: 'Nome da ficha é obrigatório' };
  }
  if (!isValidName(nome)) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  return { valid: true };
};

// Validar exercício
export const validateExercicio = (
  nome: string,
  series: any,
  repeticoes: any
): { valid: boolean; error?: string } => {
  if (!nome.trim()) {
    return { valid: false, error: 'Nome do exercício é obrigatório' };
  }
  if (!isPositiveNumber(series)) {
    return { valid: false, error: 'Séries deve ser um número positivo' };
  }
  if (!isPositiveNumber(repeticoes)) {
    return { valid: false, error: 'Repetições deve ser um número positivo' };
  }
  return { valid: true };
};
