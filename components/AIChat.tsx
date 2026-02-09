import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Loader2, Key, Sparkles, FileCode } from 'lucide-react';
import { ChatMessage, AIProvider, FileSystemItem } from '../types';
import { PROVIDER_MODELS } from '../constants';

interface AIChatProps {
  messages: ChatMessage[];
  files: FileSystemItem[];
  onSendMessage: (text: string, provider: AIProvider, model: string, apiKey: string) => void;
  isProcessing: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  files,
  onSendMessage, 
  isProcessing
}) => {
  const [input, setInput] = useState('');
  
  // Settings State
  const [provider, setProvider] = useState<AIProvider>(() => (localStorage.getItem('lemonade_provider') as AIProvider) || 'gemini');
  const [model, setModel] = useState<string>(() => localStorage.getItem('lemonade_model') || PROVIDER_MODELS['gemini'][0]);
  
  // Store all keys in one object in local state, init from localstorage
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lemonade_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', openai: '', deepseek: '', grok: '' };
  });

  const [showSettings, setShowSettings] = useState(false);
  
  // Mention / Autocomplete State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0); // For keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('lemonade_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('lemonade_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('lemonade_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Input Change for Mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInput(newVal);

    // Check if the cursor is currently at a word starting with @
    const cursorObj = e.target.selectionStart;
    if (!cursorObj) return;

    const textBeforeCursor = newVal.slice(0, cursorObj);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(currentWord.slice(1));
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.type === 'file' && f.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const insertMention = (fileName: string) => {
    const cursorObj = inputRef.current?.selectionStart;
    if (!cursorObj) return;

    const textBeforeCursor = input.slice(0, cursorObj);
    const textAfterCursor = input.slice(cursorObj);
    
    const words = textBeforeCursor.split(/\s+/);
    // Remove the partial mention
    words.pop(); 
    
    const newText = [...words, `@${fileName} `].join(' ') + textAfterCursor;
    setInput(newText);
    setShowMentions(false);
    
    // Focus back
    setTimeout(() => {
        inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredFiles.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredFiles[mentionIndex].name);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };


  // When provider changes, reset model to first in list
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (PROVIDER_MODELS[newProvider] && PROVIDER_MODELS[newProvider].length > 0) {
      setModel(PROVIDER_MODELS[newProvider][0]);
    }
  };

  const handleKeyChange = (value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const isPuter = provider === 'gemini' || provider === 'chatgpt_puter';
  const currentKey = apiKeys[provider] || '';
  const canSubmit = (input.trim().length > 0) && !isProcessing && (isPuter || currentKey.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showMentions) return; // Prevent submit if selecting file

    if (!canSubmit) {
      if (!isPuter && !currentKey) setShowSettings(true);
      return;
    }
    
    onSendMessage(input, provider, model, currentKey);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-l border-ide-border relative">
      {/* Header */}
      <div className="h-10 border-b border-ide-border flex items-center justify-between px-3">
        <span className="font-semibold text-xs uppercase tracking-wide flex items-center gap-2">
            Lemonade AI <span className="text-[10px] bg-ide-activity px-1 rounded text-ide-text">{provider === 'chatgpt_puter' ? 'ChatGPT (Puter)' : provider}</span>
        </span>
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`text-ide-text hover:text-white ${!isPuter && !currentKey ? 'animate-pulse text-yellow-400' : ''}`}
            title="Settings"
        >
            <Settings size={14} />
        </button>
      </div>

      {/* Settings Modal (Inline) */}
      {showSettings && (
          <div className="p-3 bg-ide-bg border-b border-ide-border text-xs">
              <p className="mb-2 text-yellow-400 font-bold flex items-center gap-1">
                <Key size={12} /> AI Configuration
              </p>
              
              <div className="mb-3">
                  <label className="block mb-1 opacity-70">Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                    className="w-full bg-ide-activity border border-ide-border p-1 rounded text-ide-textMain mb-2"
                  >
                      <option value="gemini">Google Gemini (Puter.js)</option>
                      <option value="chatgpt_puter">ChatGPT (Puter.js)</option>
                      <option value="openai">OpenAI (API Key)</option>
                      <option value="deepseek">DeepSeek (API Key)</option>
                      <option value="grok">Grok (API Key)</option>
                  </select>

                  <label className="block mb-1 opacity-70">Model</label>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-ide-activity border border-ide-border p-1 rounded text-ide-textMain"
                  >
                      {PROVIDER_MODELS[provider].map(m => (
                          <option key={m} value={m}>{m}</option>
                      ))}
                  </select>
              </div>

              <div className="mb-2">
                  <label className="block mb-1 opacity-70">
                    {isPuter ? 'API Key (Not Required)' : `API Key for ${provider}`}
                  </label>
                  {isPuter ? (
                    <div className="p-2 bg-ide-activity border border-ide-border rounded text-green-400 flex items-center gap-2">
                        <Sparkles size={12} />
                        <span>Powered by Puter.js (Free)</span>
                    </div>
                  ) : (
                    <>
                        <input 
                            type="password" 
                            value={currentKey}
                            onChange={(e) => handleKeyChange(e.target.value)}
                            placeholder={`Enter ${provider} API Key...`}
                            className="w-full bg-ide-activity border border-ide-border p-2 rounded text-white focus:border-ide-accent outline-none"
                        />
                        <p className="text-[10px] mt-2 opacity-50">
                            Keys are stored securely in your browser's LocalStorage.
                        </p>
                    </>
                  )}
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-ide-accent text-white py-1 rounded mt-2 hover:opacity-90"
              >
                Done
              </button>
          </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && !showSettings && (
            <div className="text-center opacity-40 mt-10 text-sm">
                <p>Ask me to create or edit files.</p>
                <p className="mt-2 text-xs font-mono">"Create a snake game"</p>
                <p className="mt-1 text-xs text-ide-text/50">Tip: Type @ to reference a file</p>
                {isPuter && (
                   <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-400">
                      <Sparkles size={12} /> Running on {provider === 'gemini' ? 'Gemini' : 'ChatGPT'} via Puter
                   </div>
                )}
            </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 
                ${msg.role === 'assistant' ? 'bg-ide-accent text-white' : 'bg-gray-600'}`}>
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`text-sm p-2 rounded max-w-[85%] whitespace-pre-wrap
                ${msg.role === 'user' ? 'bg-ide-activity' : 'bg-transparent'}`}>
                {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
             <div className="flex gap-3">
                <div className="w-6 h-6 rounded bg-ide-accent flex items-center justify-center shrink-0">
                    <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="text-sm p-2 opacity-50">Generating code with {provider}...</div>
             </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mentions Popup */}
      {showMentions && filteredFiles.length > 0 && (
          <div className="absolute bottom-14 left-2 right-2 bg-ide-activity border border-ide-border rounded shadow-xl max-h-40 overflow-y-auto z-50">
              <div className="px-2 py-1 text-[10px] text-ide-text/50 uppercase border-b border-ide-border">Files</div>
              {filteredFiles.map((file, idx) => (
                  <button
                    key={file.id}
                    onClick={() => insertMention(file.name)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ide-hover
                        ${idx === mentionIndex ? 'bg-ide-accent text-white' : 'text-ide-text'}
                    `}
                  >
                      <FileCode size={12} />
                      {file.name}
                  </button>
              ))}
          </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-ide-border bg-ide-bg relative">
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isPuter || currentKey ? "Ask Lemonade AI... (@ to mention)" : "Set API Key to chat..."}
                disabled={!isPuter && !currentKey && !showSettings}
                className="w-full bg-ide-activity text-ide-textMain text-sm rounded border border-ide-border p-2 pr-8 focus:outline-none focus:border-ide-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="off"
            />
            <button 
                type="submit" 
                className={`absolute right-2 top-2 hover:text-white transition-colors disabled:opacity-50
                    ${canSubmit ? 'text-ide-accent' : 'text-ide-text'}`}
                disabled={!canSubmit}
            >
                <Send size={14} />
            </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;