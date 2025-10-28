export interface UserMessage {
  role: 'user';
  text: string;
}

export interface AiMessage {
  role: 'ai';
  text: string;
  image?: string;
  mimeType?: string;
}

export interface UserMessageWithImages {
    role: 'user-with-images';
    text: string;
    images: { url: string; file: File }[];
}

export type ChatMessage = UserMessage | AiMessage | UserMessageWithImages;
