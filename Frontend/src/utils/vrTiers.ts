export interface VRTierInfo {
  tier: string;
  gradient: string;
  glow: boolean;
  icon: string;
  label: string;
  description: string;
  minVR: number;
  maxVR: number | null;
}

export const VR_TIERS: readonly VRTierInfo[] = [
  {
    tier: "master",
    gradient: "from-gradient-rainbow",
    glow: true,
    icon: "💥",
    label: "Master",
    description: "The absolute pinnacle - maximum VR achieved",
    minVR: 30000,
    maxVR: null,
  },
  {
    tier: "legendary",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    glow: true,
    icon: "👑",
    label: "Legendary",
    description: "True legends of racing",
    minVR: 25000,
    maxVR: 29999,
  },
  {
    tier: "elite",
    gradient: "from-purple-400 via-pink-500 to-red-500",
    glow: true,
    icon: "💎",
    label: "Elite",
    description: "Among the very best racers",
    minVR: 20000,
    maxVR: 24999,
  },
  {
    tier: "hero",
    gradient: "from-indigo-500 via-blue-600 to-cyan-500",
    glow: false,
    icon: "⭐",
    label: "Hero",
    description: "Championship-caliber racing excellence",
    minVR: 17500,
    maxVR: 19999,
  },
  {
    tier: "veteran",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    glow: false,
    icon: "🚀",
    label: "Veteran",
    description: "Experienced and skilled racers",
    minVR: 15000,
    maxVR: 17499,
  },
  {
    tier: "beast",
    gradient: "from-yellow-400 to-yellow-600",
    glow: false,
    icon: "🏆",
    label: "Beast",
    description: "Unleashing raw racing power",
    minVR: 12000,
    maxVR: 14999,
  },
  {
    tier: "expert",
    gradient: "from-orange-500 to-red-600",
    glow: false,
    icon: "🔥",
    label: "Expert",
    description: "Professional-level racing skills",
    minVR: 10000,
    maxVR: 11999,
  },
  {
    tier: "advanced",
    gradient: "from-purple-500 to-purple-700",
    glow: false,
    icon: "⚡",
    label: "Advanced",
    description: "Advanced racers",
    minVR: 8000,
    maxVR: 9999,
  },
  {
    tier: "intermediate",
    gradient: "from-blue-500 to-blue-700",
    glow: false,
    icon: "🏎️",
    label: "Intermediate",
    description: "Developing racing skills",
    minVR: 5000,
    maxVR: 7999,
  },
  {
    tier: "beginner",
    gradient: "from-gray-400 to-gray-600",
    glow: false,
    icon: "🏁",
    label: "Beginner",
    description: "Starting their racing journey",
    minVR: 0,
    maxVR: 4999,
  },
] as const;

export const SUSPICIOUS_TIER: VRTierInfo = {
  tier: "mythic",
  gradient: "from-red-500 to-red-700",
  glow: false,
  icon: "⚠️",
  label: "Suspicious",
  description: "Account flagged for suspicious activity",
  minVR: 0,
  maxVR: null,
} as const;

// VR tier styling configurations
export const VR_TIER_STYLES = {
  BORDER_COLORS: {
    master: "border-purple-200",
    legendary: "border-amber-200",
    elite: "border-purple-200",
    hero: "border-indigo-200",
    veteran: "border-emerald-200",
    beast: "border-yellow-200",
    expert: "border-orange-300",
    advanced: "border-purple-300",
    intermediate: "border-blue-300",
    beginner: "border-gray-300",
    mythic: "border-red-300",
  },
  BOLT_COLORS: {
    master: "bg-purple-200",
    legendary: "bg-amber-200",
    elite: "bg-purple-200",
    hero: "bg-indigo-200",
    veteran: "bg-emerald-200",
    beast: "bg-yellow-200",
    expert: "bg-orange-200",
    advanced: "bg-purple-200",
    intermediate: "bg-blue-200",
    beginner: "bg-gray-200",
    mythic: "bg-red-200",
  },
  TAB_COLORS: {
    master: "bg-purple-300 border-purple-400",
    legendary: "bg-amber-300 border-amber-400",
    elite: "bg-purple-300 border-purple-400",
    hero: "bg-indigo-300 border-indigo-400",
    veteran: "bg-emerald-300 border-emerald-400",
    beast: "bg-yellow-300 border-yellow-400",
    expert: "bg-orange-300 border-orange-400",
    advanced: "bg-purple-300 border-purple-400",
    intermediate: "bg-blue-300 border-blue-400",
    beginner: "bg-gray-300 border-gray-400",
    mythic: "bg-red-400 border-red-500",
  },
} as const;

export const ELITE_TIERS = [
  "master",
  "legendary",
  "elite",
  "hero",
  "veteran",
  "beast",
  "expert",
] as const;
export const GLOW_TIERS = ["master", "legendary", "elite"] as const;
export const ICON_TIERS = ["master", "elite", "grandmaster", "mythic"] as const;

export const TROPHY_RANKS = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
} as const;
