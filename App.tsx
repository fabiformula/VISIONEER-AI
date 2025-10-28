
import React, { useState, useCallback } from 'react';
// Fix: Import AiMessage to use as a type guard.
import type { ChatMessage, AiMessage } from './types';
import { generateInitialDesign, editDesign } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "¡Hola! Soy Visioneer AI. Sube una foto de tu espacio, ya sea un jardín o una habitación, и dime qué te gustaría crear. Juntos, podemos diseñar el espacio de tus sueños.",
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialDesign = useCallback(async (files: File[], prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    const imagePayloads = files.map(file => ({
        url: URL.createObjectURL(file),
        file: file,
    }));

    setMessages(prev => [
        ...prev,
        { role: 'user-with-images', text: prompt, images: imagePayloads }
    ]);
    
    try {
      const result = await generateInitialDesign(files, prompt);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: result.description, image: result.image, mimeType: result.mimeType }
      ]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: `Lo siento, encontré un error al generar el diseño. Por favor, revisa el mensaje de error de arriba.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditDesign = useCallback(async (prompt: string) => {
    // Fix for errors on lines 52 and 62: Use a type guard to correctly find and type the last AI message.
    const lastAiMessage = [...messages].reverse().find(
        (m): m is AiMessage => m.role === 'ai' && !!m.image && !!m.mimeType
    );
    
    if (!lastAiMessage) {
        setError("No se encontró una imagen anterior para editar.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);

    try {
        const result = await editDesign(lastAiMessage.image, lastAiMessage.mimeType, prompt);
        setMessages(prev => [
            ...prev,
            { role: 'ai', text: result.description, image: result.image, mimeType: result.mimeType }
        ]);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
        setError(errorMessage);
        setMessages(prev => [
            ...prev,
            { role: 'ai', text: `Lo siento, encontré un error al editar el diseño. Por favor, revisa el mensaje de error de arriba.` }
        ]);
    } finally {
        setIsLoading(false);
    }
  }, [messages]);

  const handleUndo = useCallback(() => {
    setMessages(prev => {
        // Una acción de edición siempre añade un mensaje de usuario y una respuesta de la IA.
        // Deshacer revierte estos dos últimos mensajes.
        const lastMessage = prev[prev.length - 1];
        const secondLastMessage = prev[prev.length - 2];

        if (prev.length >= 2 && lastMessage?.role === 'ai' && secondLastMessage?.role.startsWith('user')) {
            return prev.slice(0, -2);
        }
        return prev;
    });
    setError(null);
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline whitespace-pre-wrap">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Cerrar error">
              <span className="text-2xl" aria-hidden="true">&times;</span>
            </button>
          </div>
        )}
        <ChatInterface 
          messages={messages}
          onInitialDesign={handleInitialDesign}
          onEditDesign={handleEditDesign}
          onUndo={handleUndo}
          isLoading={isLoading}
        />
      </main>
      <Footer />
    </div>
  );
};

export default App;
