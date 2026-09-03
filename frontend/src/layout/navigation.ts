import {
  Activity,
  Baby,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  FileText,
  HeartPulse,
  Home,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Utensils,
  LucideIcon,
} from "lucide-react";
import { TranslationSchema } from "@/i18n/types";

export interface NavItem {
  key: keyof TranslationSchema["nav"] | string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export function getNavigationSections(t: TranslationSchema): NavSection[] {
  return [
    {
      title: t.nav.sections.overview,
      items: [
        { key: "dashboard", label: t.nav.dashboard, path: "/", icon: Home },
        { key: "insights", label: t.nav.insights, path: "/insights", icon: Activity },
        { key: "coach", label: t.nav.coach, path: "/coach", icon: Bot },
        { key: "chatHistory", label: t.nav.chatHistory, path: "/chat-history", icon: MessageCircle },
      ],
    },
    {
      title: t.nav.sections.careTools,
      items: [
        { key: "cycle", label: t.nav.cycle, path: "/cycle", icon: CalendarDays },
        { key: "pcos", label: t.nav.pcos, path: "/pcos", icon: HeartPulse },
        { key: "ppd", label: t.nav.ppd, path: "/ppd", icon: ShieldAlert },
        { key: "journal", label: t.nav.journal, path: "/journal", icon: Moon },
        { key: "nutrition", label: t.nav.nutrition, path: "/nutrition", icon: Utensils },
        { key: "caregiver", label: t.nav.caregiver, path: "/caregiver", icon: Baby },
        { key: "emergency", label: t.nav.emergency, path: "/emergency", icon: LifeBuoy },
      ],
    },
    {
      title: t.nav.sections.teamRecords,
      items: [
        { key: "asha", label: t.nav.asha, path: "/asha", icon: Users },
        { key: "reports", label: t.nav.reports, path: "/reports", icon: BarChart3 },
        { key: "profile", label: t.nav.profile, path: "/profile", icon: User },
      ],
    },
    {
      title: t.nav.sections.account,
      items: [
        { key: "settings", label: t.nav.settings, path: "/settings", icon: Settings },
        { key: "logout", label: t.nav.logout, path: "/logout", icon: LogOut },
      ],
    },
  ];
}

export const navigation = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Health Insights", path: "/insights", icon: Activity },
  { label: "AI Health Coach", path: "/coach", icon: Bot },
  { label: "Chat History", path: "/chat-history", icon: MessageCircle },
  { label: "Cycle Tracker", path: "/cycle", icon: CalendarDays },
  { label: "PCOS Prediction", path: "/pcos", icon: HeartPulse },
  { label: "PPD Detection", path: "/ppd", icon: ShieldAlert },
  { label: "Mood Journal", path: "/journal", icon: Moon },
  { label: "Nutrition Guide", path: "/nutrition", icon: Utensils },
  { label: "Caregiver Zone", path: "/caregiver", icon: Baby },
  { label: "Emergency Help", path: "/emergency", icon: LifeBuoy },
  { label: "ASHA Dashboard", path: "/asha", icon: Users },
  { label: "Reports & Analytics", path: "/reports", icon: BarChart3 },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
  { label: "Logout", path: "/logout", icon: LogOut },
];

export const navigationSections = [
  {
    title: "Overview",
    items: navigation.slice(0, 4),
  },
  {
    title: "Care Tools",
    items: navigation.slice(4, 11),
  },
  {
    title: "Team & Records",
    items: navigation.slice(11, 14),
  },
  {
    title: "Account",
    items: navigation.slice(14),
  },
];

export const navSpotlight = [
  { label: "Today", icon: Bell },
  { label: "Care plan", icon: BookOpen },
  { label: "Reports", icon: FileText },
  { label: "Insights", icon: Sparkles },
];
