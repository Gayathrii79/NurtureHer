import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { LoadingSkeleton } from "@/components/common/States";
import { useAuth } from "@/context/useAuth";
import { AuthPage } from "@/pages/AuthPages";
import { AppShell } from "@/layout/AppShell";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const DoctorDashboard = lazy(() => import("@/pages/DoctorDashboard").then((m) => ({ default: m.DoctorDashboard })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ReportsZone = lazy(() => import("@/pages/ReportsZone").then((m) => ({ default: m.ReportsZone })));
const NutritionPage = lazy(() => import("@/pages/NutritionPage").then((m) => ({ default: m.NutritionPage })));
const CareCircleQR = lazy(() => import("@/pages/CareCircleQR").then((m) => ({ default: m.CareCircleQRPage })));
const DoctorVisitAssistant = lazy(() => import("@/pages/DoctorVisitAssistant").then((m) => ({ default: m.DoctorVisitAssistant })));
const CaregiverPage = lazy(() => import("@/pages/CaregiverPage").then((m) => ({ default: m.CaregiverPage })));

const Coach = lazy(() => import("@/pages/Coach").then((m) => ({ default: m.Coach })));
const PCOSPage = lazy(() => import("@/pages/ClinicalPages").then((m) => ({ default: m.PCOSPage })));
const PPDPage = lazy(() => import("@/pages/ClinicalPages").then((m) => ({ default: m.PPDPage })));
const CyclePage = lazy(() => import("@/pages/ClinicalPages").then((m) => ({ default: m.CyclePage })));
const EmergencyPage = lazy(() => import("@/pages/ClinicalPages").then((m) => ({ default: m.EmergencyPage })));
const InsightsPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.InsightsPage })));
const ChatHistoryPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.ChatHistoryPage })));
const JournalPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.JournalPage })));
const ASHAPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.ASHAPage })));
const ProfilePage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.SettingsPage })));
const LogoutPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.LogoutPage })));
const NotFoundPage = lazy(() => import("@/pages/SupportPages").then((m) => ({ default: m.NotFoundPage })));

export default function App() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <LoadingSkeleton />;
  if (!user) return <AuthPage />;

  // Smart role-based home landing
  const getHomeElement = () => {
    if (user.role === "doctor") return <DoctorDashboard />;
    if (user.role === "admin") return <AdminDashboard />;
    if (user.role === "asha_worker") return <ASHAPage />;
    if (user.role === "caregiver") return <CaregiverPage />;
    return <Dashboard />;
  };

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes location={location} key={location.pathname}>
            {/* Dynamic Role Landing */}
            <Route path="/" element={getHomeElement()} />

            {/* Role Dedicated Portals */}
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/asha" element={<ASHAPage />} />

            {/* Core Health & Care Tools */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/chat-history" element={<ChatHistoryPage />} />
            <Route path="/cycle" element={<CyclePage />} />
            <Route path="/pcos" element={<PCOSPage />} />
            <Route path="/ppd" element={<PPDPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/doctor-visit" element={<DoctorVisitAssistant />} />
            <Route path="/carecircle" element={<CareCircleQR />} />
            <Route path="/caregiver" element={<CaregiverPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/reports" element={<ReportsZone />} />

            {/* Account & Settings */}
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
