import { GoogleGenAI, Modality, type Content } from "@google/genai";

// Helper para convertir un archivo a la parte generativa de la API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Manejar el caso de que no sea string
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// Helper para convertir una imagen base64 a la parte generativa de la API
const imageToGenerativePart = (base64Data: string, mimeType: string = 'image/jpeg') => {
  return {
    inlineData: { data: base64Data, mimeType },
  };
};

// 1. Función para generar solo la imagen
const generateImage = async (
  imageParts: any[], 
  prompt: string
): Promise<{ image: string; mimeType: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("La variable de entorno API_KEY no está configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imageModel = 'gemini-2.5-flash-image';

  const contents: Content = {
    parts: [
      ...imageParts,
      { text: prompt },
    ],
  };

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: contents,
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

  if (!imagePart?.inlineData) {
    // Check for specific safety feedback first
    if (response.promptFeedback?.blockReason) {
      const reason = response.promptFeedback.blockReason;
      let reasonText = reason;
      switch(reason) {
          case 'SAFETY':
              reasonText = 'Seguridad';
              break;
          case 'OTHER':
              reasonText = 'Otro';
              break;
      }
      
      const safetyDetails = response.promptFeedback.safetyRatings?.map(rating => {
          let categoryText = rating.category.replace('HARM_CATEGORY_', '');
          let probabilityText = rating.probability;

          const categoryTranslations: { [key: string]: string } = {
              'HARASSMENT': 'Acoso',
              'HATE_SPEECH': 'Discurso de odio',
              'SEXUALLY_EXPLICIT': 'Sexualmente explícito',
              'DANGEROUS_CONTENT': 'Contenido peligroso',
          };
          
          const probabilityTranslations: { [key: string]: string } = {
              'NEGLIGIBLE': 'Insignificante',
              'LOW': 'Baja',
              'MEDIUM': 'Media',
              'HIGH': 'Alta',
          };
          
          categoryText = categoryTranslations[categoryText] || categoryText;
          probabilityText = probabilityTranslations[probabilityText] || probabilityText;

          return `${categoryText}: ${probabilityText}`;

      }).join(', ');
      
      throw new Error(`Tu solicitud fue bloqueada por razones de "${reasonText}".\nDetalles de seguridad: ${safetyDetails}.\nPor favor, ajusta tu texto o imagen.`);
    }

    // Check for a text response from the model
    if (response.text) {
        throw new Error(`La IA respondió con texto en lugar de una imagen: "${response.text}". Esto puede ocurrir si la solicitud no fue clara o por restricciones de seguridad.`);
    }
    
    // Generic fallback error
    throw new Error("La IA no devolvió una imagen válida. Intenta reformular tu solicitud o usar una imagen diferente. La solicitud pudo haber sido bloqueada por políticas de seguridad no especificadas.");
  }

  return {
    image: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
};

// 2. Función para generar solo la descripción de texto
const generateDescription = async (
  originalImageParts: any[], 
  generatedImagePart: any, 
  userPrompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("La variable de entorno API_KEY no está configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const textModel = 'gemini-2.5-flash';

  const textPrompt = `Analiza el cambio entre la(s) imagen(es) de referencia y la imagen generada. La solicitud del usuario fue: "${userPrompt}". Describe de forma conversacional y amigable los cambios que realizaste para crear el nuevo diseño.`;

  const contents: Content = {
    parts: [
      ...originalImageParts,
      generatedImagePart,
      { text: textPrompt },
    ],
  };

  const response = await ai.models.generateContent({
    model: textModel,
    contents: contents,
  });

  return response.text.trim();
};


// --- FUNCIONES EXPORTADAS ---

// Función para el diseño inicial
export const generateInitialDesign = async (
  files: File[],
  prompt: string
): Promise<{ image: string; description: string; mimeType: string }> => {
  const userImageParts = await Promise.all(files.map(fileToGenerativePart));
  
  const imagePrompt = `Genera un rediseño fotorrealista y profesional del espacio en la(s) imagen(es) proporcionada(s), siguiendo esta instrucción del usuario: "${prompt}".`;
  const { image, mimeType } = await generateImage(userImageParts, imagePrompt);
  
  const generatedImagePart = imageToGenerativePart(image, mimeType);
  const description = await generateDescription(userImageParts, generatedImagePart, prompt);

  return { image, description, mimeType };
};

// Función para editar un diseño existente
export const editDesign = async (
  previousImage: string,
  previousMimeType: string,
  prompt: string
): Promise<{ image: string; description: string; mimeType: string }> => {
  const previousImagePart = imageToGenerativePart(previousImage, previousMimeType);
  
  const imagePrompt = `Imagina que eres un diseñador profesional (de interiores o exteriores) viendo la imagen proporcionada. Tu cliente ha pedido el siguiente cambio: "${prompt}". Visualiza cómo se vería ese cambio y genera una nueva imagen fotorrealista que muestre el resultado final. La nueva imagen debe ser una continuación natural del estilo y la atmósfera de la original.`;
  const { image, mimeType } = await generateImage([previousImagePart], imagePrompt);

  const generatedImagePart = imageToGenerativePart(image, mimeType);
  const description = await generateDescription([previousImagePart], generatedImagePart, prompt);
  
  return { image, description, mimeType };
};