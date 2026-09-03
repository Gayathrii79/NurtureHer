import ReactMarkdown from "react-markdown";
import { Bot, Heart, Mic, Paperclip, Send, Sparkles, ThumbsUp } from "lucide-react";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ChatMessage } from "@/lib/api";
import { useLanguage } from "@/context/useLanguage";
import { useEffect, useState } from "react";

export function Coach() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.chatHistory().then(setMessages).catch(() => undefined);
  }, []);

  async function send() {
    if (!message.trim() || sending) return;
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
                  <div className="mt-2 flex gap-2">
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
            {!messages.length && !sending ? (
              <div className="text-sm font-semibold text-muted">{t.coach.noConversations}</div>
            ) : null}
            {sending ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:240ms]" />
                {t.coach.typingStatus}
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
                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white"
                placeholder={t.coach.inputPlaceholder}
              />
              <Button variant="ghost" className="h-12 w-12 px-0" aria-label={t.coach.voiceInput}>
                <Mic className="h-5 w-5" />
              </Button>
              <Button className="h-12 w-12 px-0" aria-label={t.coach.sendMessage} onClick={() => void send()} disabled={sending || !message.trim()}>
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
