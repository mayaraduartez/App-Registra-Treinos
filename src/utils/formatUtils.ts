// Formatação de datas
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatação de duração
export const formatDuration = (minutes: number | string): string => {
  const mins = parseInt(minutes.toString());
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m`;
};

// Formatação de peso
export const formatWeight = (weight: number | string): string => {
  const w = parseFloat(weight.toString());
  return `${w.toFixed(1)}kg`;
};

// Formatação de séries e repetições
export const formatExerciseSet = (series: number | string, reps: number | string): string => {
  return `${series}x${reps}`;
};

// Formatar data longa
export const formatLongDate = (dateString: string): string => {
  try {
    const [dia, mes, ano] = dateString.split('/');
    const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
