/**
 * Tipos globais da aplicação
 */

export interface FichaDeTreino {
  id: string;
  nome: string;
  descricao: string;
  dataCriacao: string;
  userId?: string;
}

export interface Exercicio {
  id: string;
  nome: string;
  series: number | string;
  repeticoes: number | string;
  peso: number | string;
  dataAdicao: string;
  imagemUrl?: string;
  fichaId?: string;
  userId?: string;
}

export interface TreinoRealizado {
  id: string;
  fichaId: string;
  fichaNome: string;
  dataRealizacao: string;
  hora: string;
  duracao: string | number;
  observacoes: string;
  userId?: string;
}

export interface Usuario {
  uid: string;
  email: string | null;
  displayName?: string;
}

export interface Estatisticas {
  totalTreinos: number;
  totalHoras: number;
  fichasUnicas: number;
}
