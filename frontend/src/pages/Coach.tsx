import ReactMarkdown from "react-markdown";
import { Bot, Heart, Loader2, Mic, Paperclip, Send, Sparkles, Square, ThumbsUp, Volume2, VolumeX } from "lucide-react";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ChatMessage, uploadVoice } from "@/lib/api";
import { useLanguage } from "@/context/useLanguage";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Coach() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [loadingTtsId, setLoadingTtsId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    api.chatHistory().then(setMessages).catch(() => undefined);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function send() {
    if (!message.trim() || sending || recording) return;
    setSending(true);
    setError("");
    const text = message.trim();
    setMessage("");
    try {
      const response = await api.sendChat(text, language);
      setMessages((items) => [...items, response]);
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
      // Stop recording
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
          const response = await uploadVoice(audioFile, language);
          setMessages((items) => [...items, response]);
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

  return (
    <Page title={t.coach.title} subtitle={t.coach.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="flex min-h-[620px] flex-col overflow-hidden p-0 md:min-h-[700px]">
          <div className="border-b border-pink-100 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-black text-ink dark:text-white">{t.coach.coachName}</h2>
                <p className="text-sm text-muted dark:text-white/60">{t.coach.onlineStatus}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-pink-50/40 to-white/20 p-5 dark:from-white/5 dark:to-transparent">
            {messages.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[82%] rounded-[24px] bg-gradient-to-r from-primary to-accent px-5 py-4 text-sm leading-6 text-white shadow-sm">
                    {item.message}
                  </div>
                </div>
                <div className="max-w-[82%]">
                  <div className="rounded-[24px] bg-pink-50 px-5 py-4 text-sm leading-6 text-ink dark:bg-white/10 dark:text-white">
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
                    <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10" aria-label={t.coach.likeResponse}>
                      <ThumbsUp className="inline h-3 w-3" />
                    </button>
                    <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10" aria-label={t.coach.saveResponse}>
                      <Heart className="inline h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!messages.length && !sending && !uploadingVoice ? (
              <div className="text-sm font-semibold text-muted">{t.coach.noConversations}</div>
            ) : null}
            {sending || uploadingVoice ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:240ms]" />
                {uploadingVoice ? "Transcribing & processing voice..." : t.coach.typingStatus}
              </div>
            ) : null}
          </div>

          <div className="border-t border-pink-100 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex flex-wrap gap-2">
              {t.coach.suggestions.map((chip) => (
                <Badge key={chip} className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => setMessage(chip)}>
                  {chip}
                </Badge>
              ))}
            </div>

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

            <div className="flex gap-2 rounded-[24px] bg-gradient-to-r from-pink-50 to-purple-50 p-2 dark:from-white/10 dark:to-white/5">
              <Button variant="ghost" className="h-12 w-12 px-0" aria-label={t.coach.attachFile}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void send();
                }}
                disabled={recording || uploadingVoice}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white disabled:opacity-50"
                placeholder={recording ? "Listening to your voice..." : t.coach.inputPlaceholder}
              />
              <Button
                type="button"
                variant={recording ? "danger" : "ghost"}
                className={cn("h-12 w-12 px-0 transition", recording && "shadow-glow animate-pulse")}
                aria-label={recording ? "Stop voice recording" : t.coach.voiceInput}
                title={recording ? "Stop voice recording" : "Record voice message"}
                onClick={() => void toggleVoiceRecording()}
                disabled={uploadingVoice || sending}
              >
                {recording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                className="h-12 w-12 px-0"
                aria-label={t.coach.sendMessage}
                onClick={() => void send()}
                disabled={sending || uploadingVoice || recording || !message.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {error ? <p className="mt-2 text-sm font-bold text-danger">{error}</p> : null}
          </div>
        </Card>
        <Card>
          <SectionHeader title={t.coach.suggestedCarePlan} subtitle={t.coach.suggestedCarePlanSubtitle} />
          <div className="mt-5 space-y-4">
            {t.coach.carePlanItems.map((item) => (
              <div key={item.title} className="rounded-2xl bg-pink-50 p-4 dark:bg-white/10">
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold text-ink dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-muted dark:text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

