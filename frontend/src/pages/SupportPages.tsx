import { Activity, Bell, CheckCircle2, Download, Edit3, FileText, Filter, HeartHandshake, Lock, Play, Settings as SettingsIcon, ShieldCheck, UserRound, Utensils } from "lucide-react";
import { ActivityChart, ASHATrendChart, DoughnutChart, HeartRateChart, MoodTrendChart, NutritionChart, SleepChart, WaterChart } from "@/components/charts/Charts";
import { FormField, TextAreaField } from "@/components/common/FormField";
import { IconNote, StatTile } from "@/components/common/InfoBlocks";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/States";
import { Page } from "@/components/common/Page";
import { DataTable, MetricCard, ProgressRow, SectionHeader, Timeline } from "@/components/common/Premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { highRiskRows, moodEntries, reports, videos } from "@/data/mock";

export function InsightsPage() {
  return (
    <Page title="Health Insights" subtitle="Charts, progress, statistics, and personalized wellness patterns.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mood Stability" value="88" suffix="%" icon={HeartHandshake} progress={88} note="Improving" tone="from-mint to-emerald-400" />
        <MetricCard label="Hydration" value="6" suffix="/8" icon={Utensils} progress={75} note="2 cups remaining" tone="from-sky to-mint" />
        <MetricCard label="Rest Quality" value="7.4" suffix="h" icon={CheckCircle2} progress={74} note="Steady" tone="from-accent to-primary" />
        <MetricCard label="Risk Alerts" value="0" icon={FileText} progress={0} note="No critical alerts" tone="from-primary to-secondary" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><SectionHeader title="Mood Analytics" subtitle="Weekly calm and energy patterns" /><MoodTrendChart /></Card>
        <Card><SectionHeader title="Care Balance" subtitle="Wellness distribution" /><DoughnutChart /></Card>
        <Card><SectionHeader title="Water Intake" subtitle="Hydration by time" /><WaterChart /></Card>
        <Card><SectionHeader title="Heart Rate" subtitle="Resting trend" /><HeartRateChart /></Card>
        <Card><SectionHeader title="Sleep Analytics" subtitle="Rest quality and deep sleep" /><SleepChart /></Card>
        <Card><SectionHeader title="Activity Analytics" subtitle="Gentle movement over time" /><ActivityChart /></Card>
      </div>
      <Card>
        <SectionHeader title="Recommendations" subtitle="Small next steps with high impact" />
        <div className="grid gap-3 md:grid-cols-3">
          <ProgressRow label="Hydration habit" value={75} detail="Add one cup before evening snack." />
          <ProgressRow label="Protein coverage" value={76} detail="Breakfast goal is nearly met." />
          <ProgressRow label="Mind reset" value={64} detail="Schedule one breathing break." />
        </div>
      </Card>
    </Page>
  );
}

export function JournalPage() {
  const moods = ["😊", "😌", "😴", "😟", "😡"];
  return (
    <Page title="Mood Journal" subtitle="Emoji selector, journal editor, and timeline.">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <SectionHeader title="How do you feel?" subtitle="Private entry for today's care context" />
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood) => (
              <button key={mood} type="button" className="flex aspect-square items-center justify-center rounded-[20px] border border-white/70 bg-pink-50 text-3xl shadow-soft transition hover:-translate-y-1 hover:bg-white hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-white/10 dark:bg-white/10" aria-label={`Select mood ${mood}`}>
                {mood}
              </button>
            ))}
          </div>
          <TextAreaField className="mt-5" label="Journal note" placeholder="Write your private note..." />
          <Button className="mt-4 w-full"><Edit3 className="h-4 w-4" />Save Journal</Button>
        </Card>
        <Card>
          <SectionHeader title="Timeline" subtitle="Recent mood notes" />
          <Timeline items={moodEntries} />
        </Card>
        <Card className="xl:col-span-2">
          <SectionHeader title="Mood Calendar" subtitle="Monthly emotional pattern" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-2xl border border-white/70 shadow-soft dark:border-white/10 ${index % 5 === 0 ? "bg-accent/25" : index % 3 === 0 ? "bg-primary/25" : "bg-pink-50 dark:bg-white/10"}`}
                aria-label={`Mood calendar day ${index + 1}`}
              />
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

export function NutritionPage() {
  return (
    <Page title="Nutrition Guide" subtitle="Balanced meals, hydration, and pregnancy-safe nourishment.">
      <div className="grid gap-6 lg:grid-cols-3">
        {["Iron rich foods", "Protein support", "Hydration goal"].map((title, index) => (
          <Card key={title}>
            <Utensils className="mb-4 h-8 w-8 text-primary" />
            <h2 className="text-lg font-black text-ink dark:text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">Personalized meal ideas based on postpartum and cycle needs.</p>
            <Progress value={[72, 64, 86][index]} className="mt-5" />
            <Button variant="secondary" className="mt-5 w-full">Open Plan</Button>
          </Card>
        ))}
      </div>
      <Card>
        <SectionHeader title="Nutrition Analytics" subtitle="Coverage across key nutrients" />
        <NutritionChart />
      </Card>
    </Page>
  );
}

export function CaregiverPage() {
  return (
    <Page title="Caregiver Zone" subtitle="Educational videos, articles, and practical health tips.">
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <SearchBar placeholder="Search articles, videos, tips..." />
        <Button variant="secondary"><Filter className="h-4 w-4" />Categories</Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {videos.map((item) => (
          <Card key={item.title} className="overflow-hidden p-0">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-pink-100 via-white to-purple-100 dark:from-white/10 dark:via-white/5 dark:to-white/10">
              <Play className="h-10 w-10 fill-primary text-primary" />
            </div>
            <div className="p-5">
              <Badge className={item.accent}>{item.type}</Badge>
              <h2 className="mt-3 text-lg font-black text-ink dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted dark:text-white/60">{item.description}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-primary/70">{item.duration}</p>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function ASHAPage() {
  return (
    <Page title="ASHA Dashboard" subtitle="High-risk mothers, statistics, search, filters, and alert management.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Open Cases", "High Risk", "Alerts Sent", "Districts"].map((label, index) => (
          <Card key={label} className="overflow-hidden">
            <p className="text-sm font-bold text-muted dark:text-white/60">{label}</p>
            <p className="mt-2 text-3xl font-black text-ink dark:text-white">{String([24, 8, 156, 12][index])}</p>
            <Progress value={[72, 42, 88, 62][index]} className="mt-4" />
          </Card>
        ))}
      </div>
      <div className="mt-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchBar placeholder="Search mothers, districts, risk..." />
          <Button variant="secondary"><Filter className="h-4 w-4" />Filters</Button>
        </div>
        <DataTable
          title="High-Risk Queue"
          subtitle="Field follow-ups sorted by risk signal"
          rows={highRiskRows.map((row) => ({ mother: row.name, district: row.district, risk: row.risk, source: row.source, status: row.status }))}
          columns={["mother", "district", "risk", "source", "status"]}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card><SectionHeader title="Risk Analytics" subtitle="High and moderate risk trend" /><ASHATrendChart /></Card>
        <Card>
          <SectionHeader title="Export Report" subtitle="Field-ready summary" />
          <p className="text-sm leading-6 text-muted dark:text-white/60">Includes open cases, follow-up status, risk sources, and district distribution.</p>
          <Button className="mt-5 w-full"><Download className="h-4 w-4" />Export CSV</Button>
        </Card>
      </div>
    </Page>
  );
}

export function ReportsPage() {
  return (
    <Page title="Reports" subtitle="Exportable summaries for care teams and follow-up visits.">
      <div className="grid gap-5 md:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.name}>
            <FileText className="mb-4 h-8 w-8 text-primary" />
            <h2 className="text-lg font-black text-ink dark:text-white">{report.name}</h2>
            <p className="mt-2 text-sm text-muted dark:text-white/60">{report.status}</p>
            <Progress value={report.progress} className="mt-5" />
            <Button className="mt-5 w-full" variant="secondary"><Download className="h-4 w-4" />Download</Button>
          </Card>
        ))}
      </div>
      <Card>
        <SectionHeader title="Report Analytics" subtitle="Latest care signals included in exports" />
        <div className="grid gap-3 md:grid-cols-3">
          <ProgressRow label="Clinical readiness" value={86} />
          <ProgressRow label="Cycle completeness" value={94} />
          <ProgressRow label="Journal context" value={72} />
        </div>
      </Card>
    </Page>
  );
}

export function ProfilePage() {
  return (
    <Page title="Profile" subtitle="Editable profile, medical history, and emergency contacts.">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <UserRound className="h-12 w-12" />
          </div>
          <h2 className="mt-4 text-xl font-black text-ink dark:text-white">Aditi Sharma</h2>
          <p className="text-sm font-semibold text-muted dark:text-white/60">Mother · English</p>
          <Badge className="mt-4">Low risk profile</Badge>
        </Card>
        <Card>
          <SectionHeader title="Personal Details" subtitle="Used for safer care routing and follow-up" />
          <div className="grid gap-4 md:grid-cols-2">
            {["Full name", "Phone", "District", "Emergency contact", "Pregnancy status", "Blood group"].map((field) => (
              <FormField key={field} label={field} placeholder={field} />
            ))}
          </div>
          <Button className="mt-5">Save Changes</Button>
        </Card>
        <Card className="xl:col-span-2">
          <SectionHeader title="Medical Information" subtitle="Clinical context, emergency contact, language, and preferences" />
          <div className="grid gap-3 md:grid-cols-4">
            {["Blood group: O+", "Allergies: None", "Language: English", "Emergency: Rahul"].map((item) => (
              <StatTile key={item} label={item.split(":")[0]} value={item.split(": ")[1] ?? ""} />
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

export function SettingsPage() {
  return (
    <Page title="Settings" subtitle="Preferences, privacy, notifications, and accessibility.">
      <div className="grid gap-5 md:grid-cols-2">
        {["Push notifications", "SMS alerts", "Dark mode", "Share reports with ASHA", "Privacy lock", "Emergency escalation"].map((setting, index) => (
          <Card key={setting} className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-ink dark:text-white">{setting}</h2>
              <p className="mt-1 text-sm text-muted dark:text-white/60">Configured for safer continuity of care.</p>
            </div>
            <div className="flex items-center gap-3">
            {[SettingsIcon, Bell, SettingsIcon, ShieldCheck, Lock, Activity][index] ? (() => {
              const Icon = [SettingsIcon, Bell, SettingsIcon, ShieldCheck, Lock, Activity][index];
              return <Icon className="h-6 w-6 shrink-0 text-primary" />;
            })() : null}
              <span className={`relative h-7 w-12 rounded-full transition ${index === 2 ? "bg-muted/25" : "bg-gradient-to-r from-primary to-accent shadow-glow"}`} aria-hidden="true">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${index === 2 ? "left-1" : "left-6"}`} />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function ChatHistoryPage() {
  return (
    <Page title="Chat History" subtitle="Previous AI coach conversations and follow-up prompts.">
      <div className="space-y-4">
        {["Nutrition plan for low energy", "Cycle cramps and safe movement", "Mood support after poor sleep"].map((chat) => (
          <Card key={chat} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-ink dark:text-white">{chat}</h2>
              <p className="mt-1 text-sm text-muted dark:text-white/60">Last updated today</p>
            </div>
            <Button variant="secondary">Open</Button>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function LogoutPage() {
  return (
    <Page title="Logout" subtitle="You are still signed in on this demo dashboard.">
      <Card className="flex min-h-64 flex-col items-center justify-center text-center">
        <IconNote icon={CheckCircle2} title="Session ready" text="Use the backend auth flow to end a real session." className="max-w-md text-left" />
      </Card>
    </Page>
  );
}

export function NotFoundPage() {
  return (
    <Page title="Page not found" subtitle="The route you opened is not available.">
      <EmptyState title="Nothing here" text="Return to the dashboard to continue your care workflow." />
    </Page>
  );
}
