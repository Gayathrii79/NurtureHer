import { AlertTriangle, Baby, CheckCircle2, Heart, Lock, PhoneCall, UserCheck, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { api, CaregiverContent } from "@/lib/api";
import { useLanguage } from "@/context/useLanguage";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { LoadingSkeleton } from "@/components/common/States";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CaregiverPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CaregiverContent[]>([]);
  const [connections, setConnections] = useState<Array<{ access_id: string; mother_name: string; relationship_label: string; permissions: Record<string, boolean> }>>([]);
  const [sharedSummary, setSharedSummary] = useState<Record<string, unknown> | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"education" | "warning-signs" | "support-checklist" | "shared-status">("education");
  const [loading, setLoading] = useState(true);

  // Daily support checklist state
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({
    task1: true,
    task2: false,
    task3: false,
    task4: false,
    task5: false,
  });

  useEffect(() => {
    async function loadCaregiverData() {
      setLoading(true);
      try {
        const [videoGroup, tipGroup, articleGroup, conns] = await Promise.all([
          api.caregiver("videos").catch(() => []),
          api.caregiver("tips").catch(() => []),
          api.caregiver("articles").catch(() => []),
          api.careCircleConnections().catch(() => []),
        ]);
        setItems([...videoGroup, ...tipGroup, ...articleGroup]);
        setConnections(conns);
        if (conns.length > 0) {
          setSelectedConnection(conns[0].access_id);
          const summary = await api.careCircleSharedSummary(conns[0].access_id).catch(() => null);
          setSharedSummary(summary);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadCaregiverData();
  }, []);

  async function handleSelectConnection(accessId: string) {
    setSelectedConnection(accessId);
    try {
      const summary = await api.careCircleSharedSummary(accessId);
      setSharedSummary(summary);
    } catch {
      setSharedSummary(null);
    }
  }

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const warningSigns = t.caregiver.warningSigns.map((group, index) => ({
    ...group,
    color: index === 0
      ? "border-rose-300 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200"
      : "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200",
  }));
  const supportChecklist = t.caregiver.supportChecklist.map((task, index) => ({
    ...task,
    id: `task${index + 1}`,
  }));
  const communicationTips = t.caregiver.communicationTips;

  return (
    <Page
      title={t.caregiver.companionTitle}
      subtitle={t.caregiver.companionSubtitle}
    >
      {/* Navigation tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-lavender-200 pb-3 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("education")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "education"
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-ink hover:bg-lavender-50 dark:bg-white/10 dark:text-white"
          }`}
        >
          <Baby className="h-4 w-4" /> {t.caregiver.educationTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("warning-signs")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "warning-signs"
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-ink hover:bg-lavender-50 dark:bg-white/10 dark:text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-500" /> {t.caregiver.warningTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("support-checklist")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "support-checklist"
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-ink hover:bg-lavender-50 dark:bg-white/10 dark:text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t.caregiver.checklistTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("shared-status")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "shared-status"
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-ink hover:bg-lavender-50 dark:bg-white/10 dark:text-white"
          }`}
        >
          <UserCheck className="h-4 w-4 text-primary" /> {t.caregiver.sharedStatusTab} ({connections.length})
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* TAB 1: CAREGIVER EDUCATION */}
          {activeTab === "education" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-lavender-200/80 bg-lavender-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-black text-ink dark:text-white">{t.caregiver.familyRoleTitle}</h3>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t.caregiver.roleExplanation}
                </p>
              </div>

              {/* Communication Do's and Don'ts */}
              <Card>
                <SectionHeader
                  title={t.caregiver.communicationTitle}
                  subtitle={t.caregiver.communicationSubtitle}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  {communicationTips.map((tip, idx) => (
                    <div key={idx} className="rounded-2xl border border-lavender-200/80 p-4 dark:border-white/10">
                      <div className="rounded-xl bg-emerald-50 p-3 text-xs dark:bg-emerald-950/20">
                        <p className="font-black text-emerald-800 dark:text-emerald-200">✅ {t.caregiver.say}</p>
                        <p className="mt-1 font-semibold text-emerald-900 dark:text-emerald-100">{tip.doText}</p>
                      </div>
                      <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs dark:bg-rose-950/20">
                        <p className="font-black text-rose-800 dark:text-rose-200">❌ {t.caregiver.avoid}</p>
                        <p className="mt-1 font-semibold text-rose-900 dark:text-rose-100">{tip.dontText}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Educational Cards */}
              <div className="grid gap-5 md:grid-cols-3">
                {items.map((item) => (
                  <Card key={item.id} className="relative overflow-hidden">
                    <Badge className="mb-2">{item.category.toUpperCase()}</Badge>
                    <h3 className="text-base font-black text-ink dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-muted dark:text-white/60">{item.description}</p>
                    {item.video_url && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary">
                        <Video className="h-4 w-4" /> {t.caregiver.videoResource}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: POSTPARTUM WARNING SIGNS */}
          {activeTab === "warning-signs" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-black text-sm">{t.caregiver.warningHeading}</h3>
                </div>
                <p className="mt-1 text-xs text-rose-900/80 dark:text-rose-200/80">
                  {t.caregiver.warningNotice}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {warningSigns.map((group, idx) => (
                  <div key={idx} className={`rounded-3xl border p-6 ${group.color}`}>
                    <h3 className="text-xs font-black tracking-wider uppercase">{group.level}</h3>
                    <ul className="mt-4 space-y-3">
                      {group.signs.map((sign, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs font-bold leading-5">
                          <span className="shrink-0 mt-0.5 font-black">•</span>
                          <span>{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-rose-50 to-white dark:from-white/10 dark:to-white/5 border border-rose-100">
                <div>
                  <h4 className="font-black text-ink dark:text-white">{t.caregiver.immediateEscalation}</h4>
                  <p className="text-xs text-muted">{t.caregiver.emergencyDispatch}</p>
                </div>
                <a
                  href="tel:112"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-danger px-6 py-3 text-sm font-black text-white shadow-emergency transition hover:bg-rose-700"
                >
                  <PhoneCall className="h-4 w-4" /> {t.caregiver.callAmbulance}
                </a>
              </Card>
            </div>
          )}

          {/* TAB 3: DAILY SUPPORT CHECKLIST */}
          {activeTab === "support-checklist" && (
            <Card className="max-w-2xl mx-auto p-7">
              <SectionHeader
                title={t.caregiver.checklistTitle}
                subtitle={t.caregiver.checklistSubtitle}
              />

              <div className="space-y-3">
                {supportChecklist.map((task) => {
                  const isChecked = Boolean(checkedTasks[task.id]);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        isChecked
                          ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100"
                          : "border-lavender-200 bg-white text-ink hover:bg-lavender-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      }`}
                    >
                      <div>
                        <Badge className="mb-1">{task.category}</Badge>
                        <p className={`text-sm font-bold ${isChecked ? "line-through opacity-80" : ""}`}>
                          {task.label}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border ${
                          isChecked
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-lavender-300 bg-white dark:border-white/20 dark:bg-white/10"
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 4: MOTHER'S PERMITTED STATUS */}
          {activeTab === "shared-status" && (
            <div className="space-y-6">
              {connections.length === 0 ? (
                <Card className="text-center p-8">
                  <Lock className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-3 text-lg font-black text-ink dark:text-white">{t.caregiver.noConnections}</h3>
                  <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                    {t.caregiver.noConnectionsDesc}
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Connection Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-muted">{t.caregiver.connectedMothers}</span>
                    {connections.map((c) => (
                      <button
                        key={c.access_id}
                        type="button"
                        onClick={() => void handleSelectConnection(c.access_id)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          selectedConnection === c.access_id
                            ? "bg-primary text-white shadow-glow"
                            : "bg-lavender-100 text-ink dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {c.mother_name} ({c.relationship_label})
                      </button>
                    ))}
                  </div>

                  {/* Summary Card */}
                  {sharedSummary ? (
                    <Card>
                      <SectionHeader
                        title={`${t.caregiver.sharedHealthStatus}: ${String(sharedSummary.mother_name ?? t.ui.motherRole)}`}
                        subtitle={t.caregiver.consentFiltered}
                      />

                      <div className="grid gap-5 md:grid-cols-3">
                        {Boolean(sharedSummary.emergency) && (
                          <div className="rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                            <Badge className="mb-2">{t.caregiver.emergencySos}</Badge>
                            <p className="text-xs font-bold text-muted">{t.caregiver.emergencyContact}</p>
                            <p className="text-sm font-black text-ink dark:text-white">
                              {String((sharedSummary.emergency as Record<string, string>).emergency_contact)}
                            </p>
                            <p className="mt-2 text-xs font-bold text-muted">{t.caregiver.bloodGroup}</p>
                            <p className="text-sm font-black text-ink dark:text-white">
                              {String((sharedSummary.emergency as Record<string, string>).blood_group)}
                            </p>
                          </div>
                        )}

                        {Boolean(sharedSummary.screenings) && (
                          <div className="rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                            <Badge className="mb-2">{t.caregiver.clinicalScreening}</Badge>
                            <p className="text-xs font-bold text-muted">{t.caregiver.pcosRisk}</p>
                            <p className="text-sm font-black text-ink dark:text-white">
                              {String((sharedSummary.screenings as Record<string, string>).pcos_risk)}
                            </p>
                            <p className="mt-2 text-xs font-bold text-muted">{t.caregiver.ppdRisk}</p>
                            <p className="text-sm font-black text-ink dark:text-white">
                              {String((sharedSummary.screenings as Record<string, string>).ppd_risk)}
                            </p>
                          </div>
                        )}

                        {Boolean(sharedSummary.wellness) && (
                          <div className="rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                            <Badge className="mb-2">{t.caregiver.wellnessEnergy}</Badge>
                            <p className="text-xs font-bold text-muted">{t.caregiver.todayMood}</p>
                            <p className="text-sm font-black capitalize text-ink dark:text-white">
                              {String((sharedSummary.wellness as Record<string, string>).today_mood)}
                            </p>
                            <p className="mt-2 text-xs font-bold text-muted">{t.caregiver.recentFatigue}</p>
                            <p className="text-sm font-black text-ink dark:text-white">
                              {(sharedSummary.wellness as Record<string, boolean>).recent_fatigue ? t.caregiver.fatigueReported : t.caregiver.normalEnergy}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <LoadingSkeleton />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
