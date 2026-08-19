import ReactMarkdown from "react-markdown";
import { Bot, Heart, Mic, Paperclip, Send, Sparkles, ThumbsUp } from "lucide-react";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { promptSuggestions } from "@/data/mock";

const messages = [
  { role: "assistant", text: "Good morning, Aditi. Your cycle window and mood trend look steady today. How are you feeling?" },
  { role: "user", text: "I feel tired and a little anxious." },
  { role: "assistant", text: "**That sounds heavy.** Try a glass of water, a protein snack, and a 3-minute breathing pause. If anxiety keeps rising, connect with your ASHA worker or clinician." },
];

export function Coach() {
  return (
    <Page title="AI Health Coach" subtitle="Personalized, multilingual guidance with safe clinical guardrails.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="flex min-h-[620px] flex-col overflow-hidden p-0 md:min-h-[700px]">
          <div className="border-b border-pink-100 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-accent text-white shadow-glow">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-black text-ink dark:text-white">NurtureHer Coach</h2>
                <p className="text-sm text-muted dark:text-white/60">Online · care context enabled</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-pink-50/40 to-white/20 p-5 dark:from-white/5 dark:to-transparent">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[82%]">
                  <div
                    className={`rounded-[24px] px-5 py-4 text-sm leading-6 shadow-sm ${
                      message.role === "user" ? "bg-gradient-to-r from-primary to-accent text-white" : "bg-pink-50 text-ink dark:bg-white/10 dark:text-white"
                    }`}
                  >
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                  {message.role === "assistant" ? (
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10" aria-label="Like response"><ThumbsUp className="inline h-3 w-3" /></button>
                      <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted shadow-soft dark:bg-white/10" aria-label="Save response"><Heart className="inline h-3 w-3" /></button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:240ms]" />
              Coach is drafting a gentle check-in
            </div>
          </div>
          <div className="border-t border-pink-100 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex flex-wrap gap-2">
              {promptSuggestions.map((chip) => (
                <Badge key={chip}>{chip}</Badge>
              ))}
            </div>
            <div className="flex gap-2 rounded-[24px] bg-gradient-to-r from-pink-50 to-purple-50 p-2 dark:from-white/10 dark:to-white/5">
              <Button variant="ghost" className="h-12 w-12 px-0" aria-label="Attach file">
                <Paperclip className="h-5 w-5" />
              </Button>
              <input className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none dark:text-white" placeholder="Ask about symptoms, nutrition, cycle, mood..." />
              <Button variant="ghost" className="h-12 w-12 px-0" aria-label="Voice input">
                <Mic className="h-5 w-5" />
              </Button>
              <Button className="h-12 w-12 px-0" aria-label="Send message">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Suggested Care Plan" subtitle="Personalized from mood, cycle, and nutrition context" />
          <div className="mt-5 space-y-4">
            {["Hydration check", "Breathing exercise", "Gentle walk", "Sleep support"].map((item) => (
              <div key={item} className="rounded-2xl bg-pink-50 p-4 dark:bg-white/10">
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold text-ink dark:text-white">{item}</p>
                <p className="mt-1 text-sm text-muted dark:text-white/60">Personalized from recent mood and cycle context.</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}
