import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Upload,
  Send,
  Trash2,
  FileText,
  FileImage,
  X,
  Plus,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  School,
  HelpCircle
} from 'lucide-react';
import { LevelType, FileAttachment, Message, LevelConfig } from './types';
import EducationRenderer from './components/EducationRenderer';

// Level definitions for high school categories
const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'biennio',
    label: 'Biennio',
    emoticon: '🟢',
    description: 'Primo approccio al concetto',
    badge: '14-16 ANNI',
    tag: '[🟢 BIENNIO]',
    colorName: 'emerald',
    accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    btnActiveClass: 'bg-emerald-50 text-emerald-900 border-emerald-550 shadow-xs ring-1 ring-emerald-500/20',
    bgLightClass: 'bg-emerald-50/30',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-500 focus-within:ring-emerald-500/30 focus-within:border-emerald-500',
  },
  {
    id: 'triennio',
    label: 'Terzo Anno',
    emoticon: '🟡',
    description: 'Ha già le basi della materia',
    badge: '16-18 ANNI',
    tag: '[🟡 TERZO ANNO]',
    colorName: 'amber',
    accentClass: 'text-amber-700 bg-amber-50 border-amber-200',
    btnActiveClass: 'bg-amber-50 text-amber-900 border-amber-550 shadow-xs ring-1 ring-amber-500/20',
    bgLightClass: 'bg-amber-50/30',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-500 focus-within:ring-amber-500/30 focus-within:border-amber-500',
  },
  {
    id: 'maturita',
    label: 'Esami di Stato',
    emoticon: '🔴',
    description: "Verso l'esame di stato",
    badge: 'QUINTO ANNO',
    tag: '[🔴 ESAMI DI STATO]',
    colorName: 'rose',
    accentClass: 'text-rose-700 bg-rose-50 border-rose-200',
    btnActiveClass: 'bg-rose-50 text-rose-900 border-rose-550 shadow-xs ring-1 ring-rose-500/20',
    bgLightClass: 'bg-rose-50/30',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-500 focus-within:ring-rose-500/30 focus-within:border-rose-500',
  },
];

export default function App() {
  const [currentLevel, setCurrentLevel] = useState<LevelType>('biennio');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('spiegalivelli_history');
    const savedLevel = localStorage.getItem('spiegalivelli_level');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error('Failed to parse saved chat history', e);
      }
    }
    if (savedLevel && ['biennio', 'triennio', 'maturita'].includes(savedLevel)) {
      setCurrentLevel(savedLevel as LevelType);
    }
  }, []);

  // Save chat to localStorage when updating
  useEffect(() => {
    localStorage.setItem('spiegalivelli_history', JSON.stringify(messages));
    localStorage.setItem('spiegalivelli_level', currentLevel);
  }, [messages, currentLevel]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const activeConfig = LEVEL_CONFIGS.find(cfg => cfg.id === currentLevel) || LEVEL_CONFIGS[0];

  // Logic to process file uploads (converts file to Base64)
  const processFiles = (filesList: FileList) => {
    const pdfsAndImages = Array.from(filesList).filter(
      file => file.type === 'application/pdf' || file.type.startsWith('image/')
    );

    if (pdfsAndImages.length === 0) {
      setErrorStatus("Carica solo file in formato PDF o immagini.");
      setTimeout(() => setErrorStatus(null), 5000);
      return;
    }

    pdfsAndImages.forEach(file => {
      // Limit to 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        setErrorStatus(`Il file "${file.name}" è troppo grande. Dimensione massima 5MB.`);
        setTimeout(() => setErrorStatus(null), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAttachedFiles(prev => {
          // Prevent duplicates
          if (prev.some(item => item.name === file.name)) return prev;
          return [...prev, {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64String
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeAttachedFile = (fileName: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  // Drag and Drop files upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Start new conversation completely
  const handleNewConversation = () => {
    if (window.confirm("Sei sicuro di voler iniziare una nuova conversazione? Le spiegazioni attuali verranno archiviate.")) {
      setMessages([]);
      setAttachedFiles([]);
      setInputText('');
    }
  };

  // Submit response handler to the backend
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();

    // Must have at least a query text or a file analysis requested
    if (!textToSend && attachedFiles.length === 0) return;

    // Reset inputs
    if (!customPrompt) {
      setInputText('');
    }

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: textToSend || "Analizza questo documento o immagine ed evidenzia i concetti principali.",
      files: [...attachedFiles],
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    const sentFiles = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);
    setErrorStatus(null);

    try {
      // Setup payload for our API. The tag must be prepended dynamically to the latest message as requested.
      const payloadMessages = updatedMessages.map((msg, index) => {
        if (index === updatedMessages.length - 1) {
          return {
            role: msg.role,
            text: `${activeConfig.tag} ${msg.text}`,
            files: msg.files
          };
        }
        return {
          role: msg.role,
          text: msg.text,
          files: msg.files
        };
      });

      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: payloadMessages,
          level: currentLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Si è verificato un errore generico.');
      }

      const responseData = await response.json();

      const newModelMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseData.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newModelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorStatus(err.message || 'Errore di connessione al tutor digitale.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
    handleSendMessage(actionPrompt);
  };

  const handleUpgradeLevel = () => {
    if (currentLevel === 'biennio') {
      setCurrentLevel('triennio');
    } else if (currentLevel === 'triennio') {
      setCurrentLevel('maturita');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50/50 flex flex-col antialiased selection:bg-indigo-150 relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl -z-10" />

      {/* Header Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className={`w-3 h-8 rounded-full transition-all duration-300 ${
                currentLevel === 'biennio'
                  ? 'bg-emerald-500'
                  : currentLevel === 'triennio'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}></span>
              SpiegaLivelli
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Scegli il livello della classe e scrivi il concetto da spiegare
            </p>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                id="btn-new-chat-header"
                onClick={handleNewConversation}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all select-none cursor-pointer duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
                <span>Nuova conversazione</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Educational Application Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6 z-0">
        
        {/* Welcome Section / Levels Selection Card */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-slate-950 flex items-center gap-1.5">
              <School className="h-5 w-5 text-indigo-500" />
              <span>Scegli il livello della spiegazione</span>
            </h2>
            <p className="text-sm text-slate-500">
              Scegli il livello della classe e scrivi il concetto da spiegare
            </p>
          </div>

          {/* Three Level Choice Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEVEL_CONFIGS.map(cfg => {
              const isActive = currentLevel === cfg.id;
              
              const hoverBorders = {
                biennio: 'hover:border-emerald-400',
                triennio: 'hover:border-amber-400',
                maturita: 'hover:border-rose-400',
              }[cfg.id];

              const badgeTheme = {
                biennio: 'bg-emerald-100/70 text-emerald-700',
                triennio: 'bg-amber-100 text-amber-800',
                maturita: 'bg-rose-100 text-rose-800',
              }[cfg.id];

              const labelTheme = {
                biennio: 'text-emerald-900',
                triennio: 'text-amber-900',
                maturita: 'text-rose-900',
              }[cfg.id];

              const descTheme = {
                biennio: 'text-emerald-700/85',
                triennio: 'text-amber-800/85',
                maturita: 'text-rose-800/85',
              }[cfg.id];

              return (
                <button
                  id={`btn-lvl-${cfg.id}`}
                  key={cfg.id}
                  onClick={() => setCurrentLevel(cfg.id)}
                  className={`relative p-4 rounded-xl text-left transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none h-32 ${
                    isActive
                      ? `${cfg.btnActiveClass} border-2`
                      : `bg-white border border-slate-200 text-slate-700 ${hoverBorders} hover:shadow-2xs`
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl">{cfg.emoticon}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                      isActive
                        ? badgeTheme
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cfg.badge}
                    </span>
                  </div>

                  <div className="mt-2 text-left">
                    <h3 className={`font-bold text-sm leading-tight ${
                      isActive ? labelTheme : 'text-slate-700'
                    }`}>
                      {cfg.label}
                    </h3>
                    <p className={`text-xs mt-1 font-medium ${
                      isActive ? descTheme : 'text-slate-500'
                    }`}>
                      {cfg.description}
                    </p>
                  </div>

                  {isActive && (
                    <div className="absolute right-0 bottom-0 pointer-events-none opacity-8">
                      <Sparkles className="h-16 w-16 -mr-2 -mb-2 text-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Stream Window */}
        <div className="flex-1 min-h-[400px] flex flex-col bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          
          {/* Chat Container Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                // Setup beautiful empty state
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-16 px-4 space-y-4"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <p className="font-display font-extrabold text-base text-slate-800">
                      Nessuna spiegazione attiva
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Scegli un livello scolastico in alto, allega se preferisci un'immagine o un PDF del tuo sussidiario, e poni un quesito scolastico (ad es. la mitosi, l'Illuminismo, la relatività).
                    </p>
                  </div>
                </motion.div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  // Extract matching config for color alignment
                  const msgLevelPrefix = LEVEL_CONFIGS.find(cfg => msg.text.startsWith(cfg.tag));
                  const msgColorName = msgLevelPrefix?.colorName || activeConfig.colorName;

                  return (
                    <motion.div
                      id={`msg-${msg.id}`}
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-xs border transition-all ${
                        isUser
                          ? currentLevel === 'biennio'
                            ? 'bg-emerald-500 border-emerald-600 text-white rounded-tr-none'
                            : currentLevel === 'triennio'
                            ? 'bg-amber-500 border-amber-600 text-white rounded-tr-none'
                            : 'bg-rose-500 border-rose-600 text-white rounded-tr-none'
                          : 'bg-white border-slate-200/90 text-slate-800 rounded-tl-none'
                      }`}>
                        
                        {/* Display User Attached Files if any */}
                        {isUser && msg.files && msg.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {msg.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center gap-1.5 bg-white/10 text-white text-[11px] px-2 py-1 rounded-lg border border-white/10 font-medium"
                              >
                                {file.mimeType.startsWith('image/') ? (
                                  <FileImage className="h-3 w-3 text-sky-300" />
                                ) : (
                                  <FileText className="h-3 w-3 text-red-300" />
                                )}
                                <span className="max-w-[120px] truncate">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text Output Rendering */}
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <EducationRenderer
                            text={msg.text}
                            levelColor={msgColorName}
                            onQuickAction={handleQuickAction}
                            onUpgradeLevel={handleUpgradeLevel}
                            currentLevel={currentLevel}
                          />
                        )}

                        {/* Timestamp badge */}
                        <div className={`text-[9px] mt-2 flex justify-end font-medium ${
                          isUser ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Loader with Educational context */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-3xs border border-slate-200 rounded-tl-none flex items-center gap-3">
                    <div className="flex space-x-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        currentLevel === 'biennio'
                          ? 'bg-emerald-500'
                          : currentLevel === 'triennio'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        currentLevel === 'biennio'
                          ? 'bg-emerald-500'
                          : currentLevel === 'triennio'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} style={{ animationDelay: '150ms' }} />
                      <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        currentLevel === 'biennio'
                          ? 'bg-emerald-500'
                          : currentLevel === 'triennio'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Tutor sta elaborando spiegazione adatta al {activeConfig.label}...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatBottomRef} />
          </div>

          {/* Interactive Drag-and-Drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center pointer-events-none z-10 transition-colors">
              <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-indigo-400 max-w-sm text-center flex flex-col items-center gap-3 shadow-xl">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center animate-pulse">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="font-display font-bold text-slate-800">
                  Rilascia qui la foto o il PDF
                </h4>
                <p className="text-xs text-slate-500">
                  Massimo 5MB. SpiegaLivelli estrarrà automaticamente i concetti di studio.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorStatus && (
            <div className="bg-rose-50 border-y border-rose-100 px-4 py-2.5 text-xs text-rose-700 font-medium flex items-center justify-between">
              <span>{errorStatus}</span>
              <button
                id="btn-close-error"
                onClick={() => setErrorStatus(null)}
                className="text-rose-500 hover:text-rose-950"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Chat Input Area */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/20">
            
            {/* Attachment Preview Section */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachedFiles.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1 bg-slate-150 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-xl text-xs font-semibold group shadow-3xs"
                  >
                    {f.mimeType.startsWith('image/') ? (
                      <FileImage className="h-3.5 w-3.5 text-sky-500" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="max-w-[140px] truncate">{f.name}</span>
                    <button
                      id={`btn-remove-file-${i}`}
                      onClick={() => removeAttachedFile(f.name)}
                      className="ml-1 p-0.5 hover:bg-slate-200 hover:text-rose-700 rounded-full cursor-pointer transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Input Wrapper Row */}
            <div className={`p-1.5 bg-white rounded-2xl border-2 shadow-md transition-all duration-300 flex items-center gap-3 ${
              currentLevel === 'biennio'
                ? 'border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10'
                : currentLevel === 'triennio'
                ? 'border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10'
                : 'border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/10'
            }`}>
              
              {/* File Upload Trigger */}
              <button
                id="btn-trigger-upload"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 text-slate-400 transition-colors bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none ${
                  currentLevel === 'biennio'
                    ? 'hover:text-emerald-500'
                    : currentLevel === 'triennio'
                    ? 'hover:text-amber-500'
                    : 'hover:text-rose-500'
                }`}
                title="Carica un PDF o un'immagine"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input
                id="file-element-input"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,image/*"
                multiple
                onChange={handleFileChange}
              />

              {/* Text Area */}
              <input
                id="text-message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder="Che concetto vuoi che ti spieghi?"
                className="flex-1 py-3 px-2 outline-hidden text-slate-800 placeholder:text-slate-400 font-medium text-sm"
              />

              {/* Send Button */}
              <button
                id="btn-submit-message"
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && attachedFiles.length === 0) || isLoading}
                className={`p-3 rounded-xl text-white transition-all flex items-center justify-center cursor-pointer select-none ${
                  currentLevel === 'biennio'
                    ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300'
                    : currentLevel === 'triennio'
                    ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-300'
                    : 'bg-rose-500 hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
              <span>Trascina gli appunti o foto direttamente qui sopra per analizzarli</span>
              <span>Powered by Gemini-3.5-Flash — Rispetto del sistema didattico ministeriale</span>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Info Box */}
      <footer className="py-8 bg-slate-100/50 border-t border-slate-200/50 text-center">
        <div className="max-w-4xl mx-auto px-4 text-xs font-medium text-slate-400 flex sm:flex-row flex-col items-center justify-between gap-2">
          <span>SpiegaLivelli — Progettato con cura per studenti e insegnanti.</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Powered by</span>
            <span className="font-bold underline text-slate-600">Gemini 3.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
