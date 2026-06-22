// Funções auxiliares gerais
import * as ImagePicker from 'expo-image-picker';

// Solicitar permissão de câmera
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Selecionar imagem da galeria
export const selectImageFromGallery = async (): Promise<{
  uri: string;
  base64?: string;
} | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Permissão negada para acessar a galeria');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
    base64: true,
  });

  if ('canceled' in result && result.canceled) {
    return null;
  }

  const selected = Array.isArray((result as any).assets)
    ? (result as any).assets[0]
    : result;

  if (!selected?.uri) {
    throw new Error('Não foi possível selecionar a imagem');
  }

  return {
    uri: selected.uri,
    base64: selected.base64,
  };
};

// Upload de imagem para ImgBB
export const uploadImageToImgBB = async (base64Image: string, apiKey: string): Promise<string> => {
  if (!apiKey || apiKey.includes('COLOQUE_SUA_CHAVE')) {
    throw new Error('Chave de API ImgBB não configurada');
  }

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('image', base64Image);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error('Erro no upload da imagem');
  }

  return data.data.url;
};

// Delay assíncrono
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Gerar ID único
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
