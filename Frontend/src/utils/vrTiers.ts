import { VRTierInfo } from "../types";

export const VR_TIERS: readonly VRTierInfo[] = [
    {
        tier: "god",
        gradient: "from-white via-cyan-200 via-blue-300 via-purple-400 via-pink-500 via-red-500 via-orange-500 via-yellow-500 via-lime-500 to-white",
        glow: true,
        icon: "⭐",
        label: "God",
        description: "Beyond mastery.",
        minVR: 100000,
        maxVR: null,
    },
    {
        tier: "master",
        gradient: "from-gradient-rainbow",
        glow: true,
        icon: "💥",
        label: "Master",
        description: "The pinnacle of racing skill.",
        minVR: 30000,
        maxVR: 99999,
    },
    {
        tier: "legend",
        gradient: "from-amber-400 via-yellow-500 to-orange-500",
        glow: true,
        icon: "👑",
        label: "Legend",
        description: "Among the best.",
        minVR: 28000,
        maxVR: 29999,
    },
    {
        tier: "elite",
        gradient: "from-purple-400 via-pink-500 to-red-500",
        glow: true,
        icon: "💎",
        label: "Elite",
        description: "Top-level racer with expert control and precision.",
        minVR: 25000,
        maxVR: 27999,
    },
    {
        tier: "veteran",
        gradient: "from-indigo-500 via-blue-600 to-cyan-500",
        glow: false,
        icon: "🚀",
        label: "Veteran",
        description: "Experienced racer with refined technique and reliable results.",
        minVR: 20000,
        maxVR: 24999,
    },
    {
        tier: "challenger",
        gradient: "from-emerald-500 via-teal-500 to-cyan-600",
        glow: false,
        icon: "🏎️",
        label: "Challenger",
        description: "Racing seriously and aiming to climb the ranks.",
        minVR: 15000,
        maxVR: 19999,
    },
    {
        tier: "rising",
        gradient: "from-lime-400 to-green-500",
        glow: false,
        icon: "⚡",
        label: "Rising",
        description: "Learning the tracks and improving consistency.",
        minVR: 10000,
        maxVR: 14999,
    },
    {
        tier: "beginner",
        gradient: "from-gray-400 to-gray-600",
        glow: false,
        icon: "🏁",
        label: "Beginner",
        description: "Starting the racing journey and familiarizing with basics.",
        minVR: 0,
        maxVR: 9999,
    },
] as const;

export const SUSPICIOUS_TIER: VRTierInfo = {
    tier: "suspicious",
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
        god: "border-white",
        master: "border-purple-200",
        legend: "border-amber-200",
        elite: "border-purple-200",
        veteran: "border-indigo-200",
        challenger: "border-emerald-200",
        rising: "border-lime-200",
        beginner: "border-gray-300",
        suspicious: "border-red-300",
    },
    BOLT_COLORS: {
        god: "bg-white",
        master: "bg-purple-200",
        legend: "bg-amber-200",
        elite: "bg-purple-200",
        veteran: "bg-indigo-200",
        challenger: "bg-emerald-200",
        rising: "bg-lime-200",
        beginner: "bg-gray-200",
        suspicious: "bg-red-200",
    },
    TAB_COLORS: {
        god: "bg-gradient-to-r from-cyan-200 via-purple-300 to-pink-300 border-white",
        master: "bg-purple-300 border-purple-400",
        legend: "bg-amber-300 border-amber-400",
        elite: "bg-purple-300 border-purple-400",
        veteran: "bg-indigo-300 border-indigo-400",
        challenger: "bg-emerald-300 border-emerald-400",
        rising: "bg-lime-300 border-lime-400",
        beginner: "bg-gray-300 border-gray-400",
        suspicious: "bg-red-400 border-red-500",
    },
} as const;

export const ELITE_TIERS = [
    "god",
    "master",
    "legend",
    "elite",
    "veteran",
    "challenger",
    "rising",
] as const;

export const GLOW_TIERS = ["god", "master", "legend", "elite"] as const;
export const ICON_TIERS = ["god", "master", "legend", "elite", "suspicious"] as const;

export const TROPHY_RANKS = {
    FIRST: 1,
    SECOND: 2,
    THIRD: 3,
} as const;