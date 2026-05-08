import {
  AlertTriangle,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  User,
  Users,
  Activity,
  Gauge,
  CircleAlert,
  CircleCheck,
  Info,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  clock: Clock,
  calendar: Calendar,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  wallet: Wallet,
  target: Target,
  user: User,
  users: Users,
  activity: Activity,
  gauge: Gauge,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  info: Info,
  sparkles: Sparkles,
};

export function getIcon(name: string): LucideIcon {
  return MAP[name] ?? Info;
}
