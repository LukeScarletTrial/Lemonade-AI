export interface File {
  id: string;
  name: string;
  content: string;
  language: string;
  type: 'file';
  parentId?: string;
}

export interface Folder {
  id: string;
  name: string;
  type: 'folder';
  parentId?: string;
  isOpen: boolean;
}

export type FileSystemItem = File | Folder;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIAction {
  type: 'create' | 'update' | 'delete';
  filePath: string;
  content?: string;
}

export interface AIResponseSchema {
  explanation: string;
  actions: AIAction[];
}

export type AIProvider = 'gemini' | 'chatgpt_puter' | 'openai' | 'deepseek' | 'grok';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  files: FileSystemItem[];
}

export interface ProjectMeta {
  id: string;
  name: string;
  type?: 'html' | 'react' | 'node'; // Added project type
  lastModified: number;
  commits?: Commit[]; // Added for Git support
}