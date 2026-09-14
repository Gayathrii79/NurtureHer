import ReactMarkdown from "react-markdown";
import {
  Bot,
  Heart,
  Loader2,
  MessageSquare,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Square,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ChatConversation, ChatMessage, uploadVoice } from "@/lib/api";
import { useLanguage } from "@/context/useLanguage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACTIVE_CONV_STORAGE_KEY = "nurtureher_active_conversation_id";

export function Coach() {
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingTtsId, setLoadingTtsId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessagesForConversation = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    setError("");
    try {
      const history = await api.getConversationMessages(convId);
      setMessages(history);
      setActiveConversationId(convId);
      localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, convId);
    } catch {
      setError("Failed to load conversation messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchConversations = useCallback(async (selectSavedOrFirst = false) => {
    setLoadingConversations(true);
    try {
      const convList = await api.listConversations();
      setConversations(convList);

      if (selectSavedOrFirst) {
        const savedId = localStorage.getItem(ACTIVE_CONV_STORAGE_KEY);
        if (savedId && convList.some((c) => c.id === savedId)) {
          await loadMessagesForConversation(savedId);
        } else if (convList.length > 0) {
          await loadMessagesForConversation(convList[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch {
      // Graceful fallback to legacy history if conversation API fails
      try {
        const legacyHistory = await api.chatHistory();
        setMessages(legacyHistory);
      } catch {
        // ignore
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [loadMessagesForConversation]);

  useEffect(() => {
    void fetchConversations(true);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [fetchConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
    setError("");
  }

  async function handleDeleteConversation(e: React.MouseEvent, convId: string) {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          await loadMessagesForConversation(remaining[0].id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    }
  }

  async function send() {
    if (!message.trim() || sending || recording) return;
    setSending(true);
    setError("");
    const text = message.trim();
    setMessage("");
    try {
      const response = await api.sendChat(text, language, activeConversationId);
      setMessages((items) => [...items, response]);
      if (!activeConversationId && response.conversation_id) {
        setActiveConversationId(response.conversation_id);
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, response.conversation_id);
        void fetchConversations(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Message failed");
    } finally {
      setSending(false);
    }
  }

  async function toggleVoiceRecording() {
    if (uploadingVoice) return;
    setError("");

    if (recording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chunks: Blob[] = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setRecording(false);

        if (!chunks.length) return;
        const blobType = mimeType || "audio/webm";
        const audioBlob = new Blob(chunks, { type: blobType });
        const ext = blobType.includes("ogg") ? "ogg" : blobType.includes("wav") ? "wav" : "webm";
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${ext}`, { type: blobType });

        setUploadingVoice(true);
        try {
          const response = await uploadVoice(audioFile, language, activeConversationId);
          setMessages((items) => [...items, response]);
          if (!activeConversationId && response.conversation_id) {
            setActiveConversationId(response.conversation_id);
            localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, response.conversation_id);
            void fetchConversations(false);
          }
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Voice message processing failed.");
        } finally {
          setUploadingVoice(false);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (reason) {
      setRecording(false);
      setError(
        reason instanceof Error && reason.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : "Could not access microphone.",
      );
    }
  }

  async function handleTts(item: ChatMessage) {
    if (speakingMessageId === item.id) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setLoadingTtsId(item.id);
    setError("");

    try {
      const ttsRes = await api.tts(item.response, item.language || language);
      let cleanText = item.response;
      try {
        const decoded = atob(ttsRes.audio_base64);
        cleanText = decoded.replace(/^\[[a-zA-Z_-]+\]\s*/, "") || item.response;
      } catch {
        cleanText = item.response;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = item.language || language || "en";
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);
        window.speechSynthesis.speak(utterance);
        setSpeakingMessageId(item.id);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Text-to-speech failed");
      setSpeakingMessageId(null);
    } finally {
      setLoadingTtsId(null);
    }
  }

  // Date grouping for ChatGPT sidebar
  const groupedConversations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { title: string; items: ChatConversation[] }[] = [
      { title: "Today", items: [] },
      { title: "Yesterday", items: [] },
      { title: "Previous 7 Days", items: [] },
      { title: "Older", items: [] },
    ];

    conversations.forEach((conv) => {
      const convDate = new Date(conv.updated_at || conv.created_at);
      if (convDate >= today) {
        groups[0].items.push(conv);
      } else if (convDate >= yesterday) {
        groups[1].items.push(conv);
      } else if (convDate >= lastWeek) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [conversations]);

  const activeTitle = useMemo(() => {
    if (!activeConversationId) return "New Chat";
    const found = conversations.find((c) => c.id === activeConversationId);
    return found ? found.title : "Chat Session";
  }, [activeConversationId, conversations]);

  return (
    <Page title={t.coach.title} subtitle={t.coach.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main ChatGPT Layout Container */}
        <Card className="flex min-h-[660px] flex-col overflow-hidden p-0 md:min-h-[740px] md:flex-row shadow-xl">
          {/* Conversation Sidebar */}
          <aside
            className={cn(
              "flex flex-col border-r border-pink-100 bg-pink-50/50 dark:border-white/10 dark:bg-white/[0.03] transition-all duration-200",
              sidebarOpen ? "w-full md:w-72 md:min-w-[280px]" : "hidden md:flex md:w-16 md:min-w-[64px]",
            )}
          >
            {/* Sidebar Top: New Chat Button & Collapse Toggle */}
            <div className="flex items-center justify-between border-b border-pink-100/80 p-3 dark:border-white/10">
              {sidebarOpen ? (
                <Button
                  onClick={startNewChat}
                  variant="secondary"
                  className="flex-1 justify-start gap-2 border border-primary/30 bg-white/90 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:bg-white/10 dark:hover:bg-white/15"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">+ New Chat</span>
                </Button>
              ) : (
                <Button
                  onClick={startNewChat}
                  variant="ghost"
                  className="mx-auto h-10 w-10 p-0 text-primary"
                  title="New Chat"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setSidebarOpen((open) => !open)}
                className="ml-2 hidden h-9 w-9 p-0 text-muted hover:text-ink dark:text-white/60 dark:hover:text-white md:flex"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
            </div>

            {/* Conversation List */}
            {sidebarOpen ? (
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {loadingConversations ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                    Loading chats...
                  </div>
                ) : groupedConversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted dark:text-white/40">
                    No chat history yet. Start a new conversation!
                  </div>
                ) : (
                  groupedConversations.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted/80 dark:text-white/40">
                        {group.title}
                      </div>
                      {group.items.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        return (
                          <div
                            key={conv.id}
                            onClick={() => void loadMessagesForConversation(conv.id)}
                            className={cn(
                              "group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                              isActive
                                ? "bg-gradient-to-r from-primary/15 to-accent/15 text-primary shadow-sm border border-primary/20 dark:bg-white/10 dark:text-white"
                                : "text-ink/80 hover:bg-white/80 dark:text-white/70 dark:hover:bg-white/5",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted")} />
                              <span className="truncate">{conv.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => void handleDeleteConversation(e, conv.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger rounded-md transition"
                              title="Delete conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 space-y-2">
                {conversations.slice(0, 6).map((conv) => (
                  <Button
                    key={conv.id}
                    variant={conv.id === activeConversationId ? "primary" : "ghost"}
                    className="h-9 w-9 p-0 rounded-xl"
                    onClick={() => void loadMessagesForConversation(conv.id)}
                    title={conv.title}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            )}
          </aside>

          {/* Chat Workspace (Center) */}
          <section className="flex flex-1 flex-col min-w-0 bg-white dark:bg-card">
            {/* Chat Top Header */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-white/80 px-5 py-3.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => setSidebarOpen((open) => !open)}
                  className="h-8 w-8 p-0 md:hidden text-muted"
                  title="Toggle conversation list"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-black text-ink dark:text-white">{t.coach.coachName}</h2>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  </div>
                  <p className="truncate text-xs text-muted dark:text-white/60">
                    {activeTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={startNewChat}
                  variant="ghost"
                  className="h-8 gap-1 rounded-xl px-2.5 text-xs font-bold text-primary md:hidden"
                >
                  <Plus className="h-3.5 w-3.5" /> New
                </Button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-pink-50/20 via-white/50 to-white/10 p-5 dark:from-white/[0.02] dark:to-transparent">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 && !sending && !uploadingVoice ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pink-100/80 text-primary shadow-soft dark:bg-white/10">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h3 className="font-black text-lg text-ink dark:text-white">How can I support your health today?</h3>
                    <p className="text-xs text-muted dark:text-white/60">
                      Ask about cycles, maternal nutrition, symptoms, PPD/PCOS guidance, or voice your questions in your preferred language.
                    </p>
                  </div>
                  <div className="grid w-full max-w-lg gap-2 pt-2 sm:grid-cols-2">
                    {t.coach.suggestions.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setMessage(chip)}
                        className="rounded-2xl border border-pink-100 bg-white p-3 text-left text-xs font-semibold text-ink shadow-soft transition hover:border-primary/40 hover:bg-pink-50/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className="space-y-2">
                    {/* User Message Bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] md:max-w-[75%] rounded-[24px] rounded-tr-md bg-gradient-to-r from-primary to-accent px-5 py-3.5 text-sm leading-6 text-white shadow-sm">
                        {item.message}
                      </div>
                    </div>
                    {/* Assistant Message Bubble */}
                    <div className="max-w-[88%] md:max-w-[80%]">
                      <div className="rounded-[24px] rounded-tl-md bg-pink-50/80 px-5 py-4 text-sm leading-6 text-ink shadow-soft dark:bg-white/10 dark:text-white prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{item.response}</ReactMarkdown>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleTts(item)}
                          disabled={loadingTtsId === item.id}
                          className={cn(
                            "flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-soft transition hover:text-primary dark:bg-white/10",
                            speakingMessageId === item.id
                              ? "bg-primary text-white hover:text-white shadow-glow"
                              : "text-muted dark:text-white/70",
                          )}
                          aria-label="Read aloud response"
                          title={speakingMessageId === item.id ? "Stop reading" : "Read aloud"}
                        >
                          {loadingTtsId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : speakingMessageId === item.id ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                          <span>{speakingMessageId === item.id ? "Stop" : "Listen"}</span>
                        </button>
                        <button
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10 hover:text-primary"
                          aria-label={t.coach.likeResponse}
                        >
                          <ThumbsUp className="inline h-3 w-3" />
                        </button>
                        <button
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10 hover:text-primary"
                          aria-label={t.coach.saveResponse}
                        >
                          <Heart className="inline h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sending || uploadingVoice ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-muted bg-pink-50/60 p-3 rounded-2xl w-fit dark:bg-white/5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:240ms]" />
                  <span>{uploadingVoice ? "Transcribing & processing voice..." : t.coach.typingStatus}</span>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Footer */}
            <div className="border-t border-pink-100 bg-white/90 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              {messages.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                  {t.coach.suggestions.slice(0, 3).map((chip) => (
                    <Badge
                      key={chip}
                      className="cursor-pointer transition hover:scale-105 active:scale-95 text-[11px]"
                      onClick={() => setMessage(chip)}
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>
              )}

              {recording ? (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-ping rounded-full bg-rose-500" />
                    <span>Recording voice message... Tap stop to send</span>
                  </div>
                  <Button
                    variant="danger"
                    className="h-8 gap-1.5 rounded-xl px-3 text-xs"
                    onClick={() => void toggleVoiceRecording()}
                  >
                    <Square className="h-3 w-3 fill-current" /> Stop & Send
                  </Button>
                </div>
              ) : null}

              <div className="flex gap-2 rounded-[24px] bg-gradient-to-r from-pink-50 to-purple-50 p-1.5 dark:from-white/10 dark:to-white/5 shadow-inner">
                <Button variant="ghost" className="h-11 w-11 shrink-0 px-0" aria-label={t.coach.attachFile}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void send();
                  }}
                  disabled={recording || uploadingVoice}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none dark:text-white disabled:opacity-50"
                  placeholder={recording ? "Listening to your voice..." : t.coach.inputPlaceholder}
                />
                <Button
                  type="button"
                  variant={recording ? "danger" : "ghost"}
                  className={cn("h-11 w-11 shrink-0 px-0 transition", recording && "shadow-glow animate-pulse")}
                  aria-label={recording ? "Stop voice recording" : t.coach.voiceInput}
                  title={recording ? "Stop voice recording" : "Record voice message"}
                  onClick={() => void toggleVoiceRecording()}
                  disabled={uploadingVoice || sending}
                >
                  {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  className="h-11 w-11 shrink-0 px-0 rounded-full"
                  aria-label={t.coach.sendMessage}
                  onClick={() => void send()}
                  disabled={sending || uploadingVoice || recording || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {error ? <p className="mt-2 text-xs font-bold text-danger">{error}</p> : null}
            </div>
          </section>
        </Card>

        {/* Right Care Plan Info Sidebar */}
        <Card className="h-fit">
          <SectionHeader title={t.coach.suggestedCarePlan} subtitle={t.coach.suggestedCarePlanSubtitle} />
          <div className="mt-4 space-y-3">
            {t.coach.carePlanItems.map((item) => (
              <div key={item.title} className="rounded-2xl bg-pink-50/70 p-3.5 dark:bg-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-bold text-sm text-ink dark:text-white">{item.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted dark:text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

