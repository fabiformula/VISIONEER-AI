
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onInitialDesign: (files: File[], prompt: string) => void;
  onEditDesign: (prompt: string) => void;
  onUndo: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<{
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isEditingAllowed: boolean;
}> = ({ onSendMessage, isLoading, isEditingAllowed }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading && isEditingAllowed) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="mt-auto p-4 bg-white border-t">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isEditingAllowed ? "Describe los cambios que quieres hacer..." : "Genera un diseño para empezar a editar"}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          disabled={!isEditingAllowed || isLoading}
        />
        <button 
          onClick={handleSend}
          disabled={!isEditingAllowed || isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

const InitialUploader: React.FC<{
  onInitialDesign: (files: File[], prompt: string) => void;
  isLoading: boolean;
}> = ({ onInitialDesign, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('Rediseña este espacio para que sea más moderno y acogedor.');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = () => {
    if (files.length > 0 && prompt.trim() && !isLoading) {
      onInitialDesign(files, prompt.trim());
    }
  };

  return (
    <div className="mt-auto p-4 bg-white border-t rounded-b-lg">
        <div className="border border-gray-300 rounded-lg p-4">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe tu visión..."
                className="w-full p-2 border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={isLoading}
            />
            <div className="flex items-center justify-between">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    disabled={isLoading}
                 >
                    {files.length > 0 ? `${files.length} imagen(es)` : 'Seleccionar Imágenes'}
                 </button>
                 <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                 />
                 <button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || !prompt.trim() || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 transition-colors flex items-center"
                 >
                    {isLoading ? 'Diseñando...' : 'Generar Diseño'}
                 </button>
            </div>
        </div>
    </div>
  );
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onInitialDesign, onEditDesign, onUndo, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasGeneratedDesign = messages.some(m => m.role === 'ai' && 'image' in m);
  const aiDesignMessages = messages.filter(m => m.role === 'ai' && 'image' in m);
  // Fix: Replace findLastIndex with a compatible alternative for older JS targets.
  const lastAiDesignIndex = messages
    .map(m => m.role === 'ai' && 'image' in m && !!m.image)
    .lastIndexOf(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleDownload = (base64Image: string, mimeType: string) => {
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64Image}`;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `visioneer-ai-design-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
  };

  return (
    <div className="flex-grow flex flex-col bg-white rounded-lg shadow-lg border">
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.role.startsWith('user') ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0"></div>}
            
            <div className={`max-w-md lg:max-w-2xl rounded-xl p-4 ${msg.role.startsWith('user') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.role === 'user-with-images' && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                    {msg.images.map((img, i) => (
                        <img key={i} src={img.url} alt="preview" className="w-full h-20 object-cover rounded-md" />
                    ))}
                </div>
              )}
              {msg.role === 'ai' && msg.image && (
                <>
                    <img 
                        src={`data:${msg.mimeType};base64,${msg.image}`} 
                        alt="Diseño de espacio"
                        className="w-full object-contain rounded-lg mb-2"
                    />
                    <div className="mt-3 flex items-stretch gap-3">
                        <button
                            onClick={() => handleDownload(msg.image!, msg.mimeType!)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            aria-label="Guardar Diseño"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Guardar
                        </button>
                        {index === lastAiDesignIndex && aiDesignMessages.length > 1 && !isLoading && (
                            <button
                                onClick={onUndo}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                aria-label="Deshacer último cambio"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" transform="scale(-1, 1)">
                                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" transform="rotate(90 10 10) translate(0, 4)"/>
                                </svg>
                                Deshacer
                            </button>
                        )}
                    </div>
                </>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>

            {msg.role.startsWith('user') && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0"></div>
                <div className="max-w-md lg:max-w-xl rounded-xl p-4 bg-gray-100">
                    <div className="flex items-center space-x-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-pulse"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {hasGeneratedDesign ? 
        <ChatInput onSendMessage={onEditDesign} isLoading={isLoading} isEditingAllowed={true} /> : 
        <InitialUploader onInitialDesign={onInitialDesign} isLoading={isLoading} />
      }
    </div>
  );
};

export default ChatInterface;
