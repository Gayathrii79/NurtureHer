import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { LoadingSkeleton } from "@/components/common/States";
import { AppShell } from "@/layout/AppShell";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Coach = lazy(() => import("@/pages/Coach").then((module) => ({ default: module.Coach })));
const PCOSPage = lazy(() => import("@/pages/ClinicalPages").then((module) => ({ default: module.PCOSPage })));
const PPDPage = lazy(() => import("@/pages/ClinicalPages").then((module) => ({ default: module.PPDPage })));
const CyclePage = lazy(() => import("@/pages/ClinicalPages").then((module) => ({ default: module.CyclePage })));
const EmergencyPage = lazy(() => import("@/pages/ClinicalPages").then((module) => ({ default: module.EmergencyPage })));
const InsightsPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.InsightsPage })));
const ChatHistoryPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.ChatHistoryPage })));
const JournalPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.JournalPage })));
const NutritionPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.NutritionPage })));
const CaregiverPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.CaregiverPage })));
const ASHAPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.ASHAPage })));
const ReportsPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.ReportsPage })));
const ProfilePage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.SettingsPage })));
const LogoutPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.LogoutPage })));
const NotFoundPage = lazy(() => import("@/pages/SupportPages").then((module) => ({ default: module.NotFoundPage })));

export default function App() {
  const location = useLocation();
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/chat-history" element={<ChatHistoryPage />} />
            <Route path="/cycle" element={<CyclePage />} />
            <Route path="/pcos" element={<PCOSPage />} />
            <Route path="/ppd" element={<PPDPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/caregiver" element={<CaregiverPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/asha" element={<ASHAPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </AppShell>
  );
}
