import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { StarField } from '@/components/StarField';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UpgradeModal } from '@/components/UpgradeModal';
import { MessageCircle, Send, Bot, User, AlertCircle, RotateCcw, Sparkles, Plus, Play, Lock, Crown, Paperclip, X, Image as ImageIcon, History, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatImage {
  data: string;     // base64 without prefix or raw base64
  mimeType: string; // e.g. "image/jpeg", "image/png"
  previewUrl: string;
}

interface SavedConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  systemContext?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: {
    previewUrl?: string;
    mimeType?: string;
  };
  error?: boolean;
}

interface ChatSession {
  systemContext: string;
  firstName: string;
}

const exampleMessages: ChatMessage[] = [
  { role: 'user', content: "What energy should I expect today?" },
  { role: 'assistant', content: "Your Personal Day 7 is calling for reflection and inner work. Combined with your Life Path's need for structure, today is perfect for planning rather than action." },
  { role: 'user', content: "How compatible am I with someone born March 15?" },
  { role: 'assistant', content: "A Pisces! Their water energy flows beautifully with your earth grounding. Their Life Path would complement your stability with creativity." },
];

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, lineIndex) => {
      if (line.trim().startsWith('*') && !line.trim().startsWith('**')) {
        const bulletMatch = line.match(/^\s*\*\s+(.+)$/);
        if (bulletMatch) {
          const bulletContent = parseInlineMarkdown(bulletMatch[1], `bullet-${lineIndex}`);
          elements.push(
            <div key={lineIndex} className="flex gap-2 ml-2 my-1">
              <span className="text-amber-9">•</span>
              <span>{bulletContent}</span>
            </div>
          );
          return;
        }
      }
      
      const inlineContent = parseInlineMarkdown(line, `line-${lineIndex}`);
      elements.push(
        <span key={lineIndex}>
          {inlineContent}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
    
    return elements;
  };

  const parseInlineMarkdown = (text: string, keyPrefix: string) => {
    const parts: JSX.Element[] = [];
    let remaining = text;
    let partIndex = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
      
      let firstMatch: { index: number; length: number; content: string; type: 'bold' | 'italic' } | null = null;
      
      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = { 
          index: boldMatch.index, 
          length: boldMatch[0].length, 
          content: boldMatch[1], 
          type: 'bold' 
        };
      }
      
      if (italicMatch && italicMatch.index !== undefined) {
        if (!firstMatch || italicMatch.index < firstMatch.index) {
          firstMatch = { 
            index: italicMatch.index, 
            length: italicMatch[0].length, 
            content: italicMatch[1], 
            type: 'italic' 
          };
        }
      }
      
      if (firstMatch) {
        if (firstMatch.index > 0) {
          parts.push(<span key={`${keyPrefix}-${partIndex++}`}>{remaining.slice(0, firstMatch.index)}</span>);
        }
        
        if (firstMatch.type === 'bold') {
          parts.push(<strong key={`${keyPrefix}-${partIndex++}`} className="font-semibold">{firstMatch.content}</strong>);
        } else {
          parts.push(<em key={`${keyPrefix}-${partIndex++}`} className="italic text-amber-11">{firstMatch.content}</em>);
        }
        
        remaining = remaining.slice(firstMatch.index + firstMatch.length);
      } else {
        parts.push(<span key={`${keyPrefix}-${partIndex++}`}>{remaining}</span>);
        break;
      }
    }
    
    return parts;
  };

  return <div className={className}>{parseMarkdown(content)}</div>;
}

function CosmicLoadingAnimation() {
  return (
    <div className="flex gap-3 justify-start" data-testid="message-loading">
      <div className="w-8 h-8 rounded-md bg-amber-a3 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-amber-9" />
      </div>
      <div className="flex items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-amber-9" />
        </motion.div>
      </div>
    </div>
  );
}

function ChatBubble({ msg, index, isExample = false }: { msg: ChatMessage; index: number; isExample?: boolean }) {
  return (
    <div
      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${isExample ? 'opacity-50' : ''}`}
      data-testid={isExample ? `example-${msg.role}-${index}` : `message-${msg.role}-${index}`}
    >
      {msg.role === 'assistant' && (
        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${msg.error ? 'bg-red-500/20' : 'bg-amber-a3'}`}>
          {msg.error ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Bot className="w-4 h-4 text-amber-9" />
          )}
        </div>
      )}
      <div
        className={`max-w-[80%] p-4 rounded-lg flex flex-col gap-2 ${
          msg.role === 'user'
            ? 'bg-amber-9 text-gray-1 rounded-tr-sm'
            : msg.error
              ? 'bg-red-500/10 border border-red-500/20 rounded-tl-sm'
              : 'bg-gray-a3 rounded-tl-sm'
        }`}
      >
        {msg.image?.previewUrl && (
          <div className="rounded overflow-hidden max-h-60 border border-white/10">
            <img 
              src={msg.image.previewUrl} 
              alt="Uploaded chart or image" 
              className="max-h-60 w-auto object-contain rounded" 
            />
          </div>
        )}
        <MarkdownContent content={msg.content} className={`text-2 ${msg.error ? 'text-red-400' : ''}`} />
      </div>
      {msg.role === 'user' && (
        <div className="w-8 h-8 rounded-md bg-gray-a3 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

export default function CueChats() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<ChatImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savedOdisId = localStorage.getItem('gg33-odis-id');
  const { data: profileData } = useQuery<{ isPro?: boolean }>({
    queryKey: ['/api/profile', savedOdisId],
    enabled: !!savedOdisId,
  });
  const isPro = profileData?.isPro ?? false;

  const fetchConversations = async () => {
    if (!savedOdisId) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/conversations/${savedOdisId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversation history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (savedOdisId && isPro) {
      fetchConversations();
    }
  }, [savedOdisId, isPro]);

  const loadConversation = async (convo: SavedConversation) => {
    setCurrentConversationId(convo.id);
    setMessages(convo.messages || []);
    setShowPreview(false);
    setShowHistory(false);

    // Refresh with the latest persona systemContext if odisId exists
    if (savedOdisId) {
      try {
        const response = await fetch('/api/chat/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ odisId: savedOdisId }),
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.systemContext) {
          setChatSession({
            systemContext: data.systemContext,
            firstName: data.firstName,
          });
        }
      } catch (e) {
        console.error("Failed to refresh chat session on load:", e);
        if (convo.systemContext) {
          setChatSession({
            systemContext: convo.systemContext,
            firstName: 'Friend',
          });
        }
      }
    } else if (convo.systemContext) {
      setChatSession({
        systemContext: convo.systemContext,
        firstName: 'Friend',
      });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!savedOdisId) return;
    try {
      await fetch(`/api/chat/conversation/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odisId: savedOdisId }),
        credentials: 'include',
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size must be less than 20MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mime, 0.85);
          const base64Data = compressedDataUrl.split(',')[1] || '';
          setSelectedImage({
            data: base64Data,
            mimeType: mime,
            previewUrl: compressedDataUrl,
          });
        } else {
          const base64Parts = result.split(',');
          setSelectedImage({
            data: base64Parts[1] || '',
            mimeType: file.type,
            previewUrl: result,
          });
        }
      };
      img.onerror = () => {
        const base64Parts = result.split(',');
        setSelectedImage({
          data: base64Parts[1] || '',
          mimeType: file.type,
          previewUrl: result,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = async () => {
    if (isInitializing) return;
    
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    
    const odisId = localStorage.getItem('gg33-odis-id');
    
    if (!odisId) {
      setError('Please create your profile first to use CueChats');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odisId }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success && data.systemContext) {
        setChatSession({
          systemContext: data.systemContext,
          firstName: data.firstName,
        });
        setShowPreview(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        throw new Error(data.error || 'Failed to initialize chat');
      }
    } catch (err) {
      console.error('Chat init error:', err);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!chatSession || (!inputValue.trim() && !selectedImage)) return;

    const userMessage = inputValue.trim() || (selectedImage ? "Please analyze this image based on my chart." : "");
    const imageToSend = selectedImage;
    
    setInputValue('');
    setSelectedImage(null);
    setError(null);
    
    const newUserMessage: ChatMessage = { 
      role: 'user', 
      content: userMessage,
      image: imageToSend ? {
        previewUrl: imageToSend.previewUrl,
        mimeType: imageToSend.mimeType,
      } : undefined,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(msg => !msg.error)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemContext: chatSession.systemContext,
          firstName: chatSession.firstName,
          conversationHistory,
          image: imageToSend ? {
            data: imageToSend.data,
            mimeType: imageToSend.mimeType,
          } : undefined,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
        const updatedMessages = [...messages, newUserMessage, assistantMessage];
        setMessages(prev => [...prev, assistantMessage]);

        // Auto-save to conversation history
        const convoId = currentConversationId || `chat_${Date.now()}`;
        if (!currentConversationId) {
          setCurrentConversationId(convoId);
        }

        if (savedOdisId) {
          // Derive a concise title from the first message or preserve existing
          const existingConvo = conversations.find(c => c.id === convoId);
          const firstUserMsg = updatedMessages.find(m => m.role === 'user');
          const title = existingConvo?.title || (firstUserMsg ? (firstUserMsg.content.slice(0, 35) + (firstUserMsg.content.length > 35 ? "..." : "")) : "Astrology Reading");

          fetch('/api/chat/conversation/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: convoId,
              odisId: savedOdisId,
              title,
              messages: updatedMessages.map(m => ({
                role: m.role,
                content: m.content,
                image: m.image ? {
                  previewUrl: m.image.previewUrl,
                  mimeType: m.image.mimeType,
                } : undefined,
              })),
              systemContext: chatSession.systemContext,
            }),
            credentials: 'include',
          }).then(() => fetchConversations()).catch(err => console.error("Error auto-saving conversation:", err));
        }
      } else {
        throw new Error('No response received');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an issue generating a response. Please try again.',
        error: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = async () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputValue('');
    setSelectedImage(null);
    setError(null);
    setChatSession(null);
    await startChat();
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      <StarField />
      <Navigation />
      
      <main className="pt-20 pb-12 px-4 min-h-screen" data-testid="page-cuechats">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              <MessageCircle className="w-3 h-3 mr-1" />
              AI Guidance
            </Badge>
            <h1 className="text-6 md:text-7 font-semibold mb-4">
              <span className="gradient-text">CueChats</span>
            </h1>
            <p className="text-gray-11 text-3 max-w-2xl mx-auto">
              Get personalized guidance based on your unique energy signature and current cosmic cycles.
            </p>
          </div>

          <Card variant="frosted">
            <CardHeader className="border-b border-gray-5/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-1" />
                  </div>
                  <div>
                    <CardTitle className="text-4">CueChat AI</CardTitle>
                    <CardDescription className="text-2 text-gray-11">
                      {chatSession ? `Chatting with ${chatSession.firstName}` : 'Powered by your energy profile'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!isPro) {
                        setShowUpgradeModal(true);
                        return;
                      }
                      setShowHistory(prev => !prev);
                      if (!showHistory) fetchConversations();
                    }}
                    title="Chat History"
                    data-testid="button-toggle-history"
                  >
                    <History className="w-4 h-4 mr-1 text-amber-9" />
                    <span className="hidden sm:inline">History</span>
                    {conversations.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-9/20 text-amber-9 border border-amber-9/30">
                        {conversations.length}
                      </span>
                    )}
                  </Button>

                  {!showPreview && (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={startNewChat}
                      disabled={isLoading || isInitializing}
                      data-testid="button-new-chat"
                    >
                      {isInitializing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="mr-1"
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          New Chat
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {showHistory && (
                <div className="border-b border-gray-5/50 bg-gray-2/80 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-9" />
                      <h3 className="text-sm font-semibold text-gray-12">Conversation History</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-11 hover:text-white"
                      onClick={() => setShowHistory(false)}
                      data-testid="button-close-history"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Close
                    </Button>
                  </div>
                  
                  {isLoadingHistory ? (
                    <div className="py-6 flex items-center justify-center text-xs text-gray-11 gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-9" />
                      Loading your conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-11">
                      No saved conversations yet. Start chatting to save your readings!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {conversations.map((convo) => {
                        const isCurrent = convo.id === currentConversationId;
                        const formattedDate = new Date(convo.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={convo.id}
                            onClick={() => loadConversation(convo)}
                            className={`group flex items-center justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                              isCurrent 
                                ? 'border-amber-9/50 bg-amber-9/10 text-amber-9'
                                : 'border-white/5 bg-gray-a2 hover:bg-gray-a3 hover:border-white/10'
                            }`}
                            data-testid={`convo-item-${convo.id}`}
                          >
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                              <span className="text-xs font-medium text-gray-12 truncate group-hover:text-amber-9 transition-colors">
                                {convo.title || 'Astrology Reading'}
                              </span>
                              <span className="text-[10px] text-gray-10 flex items-center gap-1 mt-0.5">
                                {formattedDate} • {convo.messages?.length || 0} messages
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-11 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              title="Delete conversation"
                              onClick={(e) => deleteConversation(convo.id, e)}
                              data-testid={`button-delete-convo-${convo.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className={`${showPreview ? '' : 'h-96 overflow-y-auto custom-scrollbar'} p-6 space-y-4`}>
                {showPreview ? (
                  <>
                    {exampleMessages.map((msg, i) => (
                      <ChatBubble key={i} msg={msg} index={i} isExample />
                    ))}
                    
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={startChat}
                        disabled={isInitializing}
                        data-testid="button-start-chat"
                      >
                        {isInitializing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Chat
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {!hasMessages && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-11">
                        <Bot className="w-12 h-12 text-amber-9 mb-4" />
                        <p className="text-3">Ask me anything</p>
                      </div>
                    )}
                    
                    {messages.map((msg, i) => (
                      <div key={i}>
                        <ChatBubble msg={msg} index={i} />
                        {msg.error && (
                          <div className="flex gap-3 justify-start mt-1">
                            <div className="w-8" />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400"
                              onClick={() => {
                                setMessages(prev => prev.filter((_, idx) => idx !== i));
                                setError(null);
                              }}
                              data-testid={`button-retry-${i}`}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && <CosmicLoadingAnimation />}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {error && (
                <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/20">
                  <p className="text-2 text-red-400" data-testid="text-chat-error">{error}</p>
                </div>
              )}

              {!showPreview && (
                <div className="p-4 border-t border-gray-5/50 bg-gray-a2 flex flex-col gap-2">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                  />

                  {/* Selected image preview bar */}
                  {selectedImage && (
                    <div className="flex items-center gap-2 bg-gray-a3 p-2 rounded-md border border-white/10 w-fit max-w-full">
                      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-amber-9/30">
                        <img 
                          src={selectedImage.previewUrl} 
                          alt="Attachment preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-col text-xs pr-2 overflow-hidden">
                        <span className="text-gray-12 font-medium truncate">Image attached</span>
                        <span className="text-gray-10 text-[10px]">Gemini will analyze this</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-11 hover:text-white rounded-full ml-1"
                        onClick={() => setSelectedImage(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Paperclip / Image upload button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-11 hover:text-amber-9 flex-shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      title="Upload chart, palm, tarot or screenshot"
                      data-testid="button-upload-image"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    <Input
                      ref={inputRef}
                      variant="frosted"
                      placeholder={selectedImage ? "Add a question about this image (or press Send)..." : "Ask about your energy, compatibility, decisions..."}
                      className="flex-1"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      variant="gold" 
                      size="icon" 
                      onClick={sendMessage}
                      disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                      data-testid="button-send-message"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}
