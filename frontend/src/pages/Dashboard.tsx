import { Activity, CalendarHeart, HeartPulse, LifeBuoy, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { api, DashboardStats } from "@/lib/api";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/States";
import { MetricCard, SectionHeader } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api.dashboard().then(setData).catch(() => setError(true)); }, []);
  if (!data && !error) return <LoadingSkeleton />;
  if (error) return <ErrorState />;
  const stats = data as DashboardStats;
  const mood = stats.today_mood?.mood ?? "No entry";
  const symptomCount = stats.symptoms ? Object.values(stats.symptoms).filter((value) => value === true).length : 0;
  return <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <Card className="soft-grid noise surface-shine overflow-hidden p-6 md:p-8"><Badge>Care overview</Badge><h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-ink dark:text-white md:text-6xl">A calmer way to understand your health today.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-muted dark:text-white/65">Your latest records and risk signals are organized here for your next care decision.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">Mood: {mood}</div><div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">Symptoms: {symptomCount}</div><div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-ink shadow-soft dark:bg-white/10 dark:text-white">Cycle: {stats.cycle_prediction ?? "Not tracked"}</div></div></Card>
      <div className="space-y-4"><Card><SectionHeader title="Latest care signals" subtitle="Returned from your secure health record" /><div className="space-y-3 text-sm font-bold text-muted dark:text-white/65"><p><CalendarHeart className="mr-2 inline h-4 w-4 text-primary" />Next cycle estimate: {stats.cycle_prediction ?? "Not available"}</p><p><Activity className="mr-2 inline h-4 w-4 text-primary" />Mood: {mood}</p></div></Card><Card className="border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-500/15 dark:via-white/10 dark:to-primary/10"><div className="flex items-start gap-3"><LifeBuoy className="h-7 w-7 text-rose-600" /><div><p className="text-sm font-black text-rose-600">Emergency Support</p><p className="mt-1 text-sm leading-6 text-muted dark:text-white/60">Seek urgent professional care for severe or dangerous symptoms.</p></div></div><Button variant="danger" className="mt-5 w-full" onClick={() => { window.location.href = "/emergency"; }}>Open emergency help</Button></Card></div>
    </section>
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"><MetricCard label="PCOS Risk" value={stats.pcos_risk ?? "Not assessed"} icon={HeartPulse} progress={riskProgress(stats.pcos_risk)} note="Latest screening result" tone="from-primary to-secondary" /><MetricCard label="PPD Status" value={stats.ppd_status ?? "Not assessed"} icon={Stethoscope} progress={riskProgress(stats.ppd_status)} note="Latest EPDS result" tone="from-sky to-accent" /><MetricCard label="Latest Mood" value={mood} icon={ShieldCheck} note="Personal wellness log" tone="from-emerald-400 to-mint" /><MetricCard label="Active Symptoms" value={String(symptomCount)} icon={Activity} note="From your latest entry" tone="from-rose-400 to-primary" /></section>
    <Insights />
  </div>;
}

function riskProgress(value: string | null) { return value?.toLowerCase() === "high" ? 90 : value?.toLowerCase() === "moderate" ? 55 : value ? 20 : 0; }

function Insights() {
  const [items, setItems] = useState<{ category: string; severity: string; message: string }[]>([]);
  useEffect(() => { api.insights().then((response) => setItems(response.insights)).catch(() => undefined); }, []);
  return <Card><SectionHeader title="Wellness insights" subtitle="Generated from your latest records" />{items.length ? <div className="space-y-3">{items.map((item) => <div key={`${item.category}-${item.message}`} className="rounded-[18px] bg-pink-50/80 p-4 dark:bg-white/10"><div className="flex items-center justify-between"><p className="font-black capitalize text-ink dark:text-white">{item.category}</p><span className="text-xs font-black uppercase text-primary">{item.severity}</span></div><p className="mt-1 text-sm leading-6 text-muted dark:text-white/60">{item.message}</p></div>)}</div> : <EmptyState title="No insights yet" text="Add a mood, symptom, cycle, or assessment to create a personal insight." />}</Card>;
}