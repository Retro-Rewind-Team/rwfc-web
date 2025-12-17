export const TIME_PERIODS = {
    LAST_24H: "24",
    LAST_WEEK: "week",
    LAST_MONTH: "month",
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const SORT_FIELDS = {
    RANK: "rank",
    VR: "vr",
    NAME: "name",
    LAST_SEEN: "lastSeen",
} as const;

export const RANK_ICONS = {
    FIRST: "🏆",
    SECOND: "🥈",
    THIRD: "🥉",
} as const;

export const REFETCH_INTERVALS = {
    STATS: 60000, // 1 minute
    LEADERBOARD: 60000, // 1 minute
} as const;

export const DEBOUNCE_DELAYS = {
    SEARCH: 300, // 300ms
    FILTER: 100, // 100ms
} as const;

export const VR_TIER_SIZES = {
    sm: {
        plate: "w-16 h-10",
        text: "text-xs",
        bolt: "w-1.5 h-1.5",
        boltPos: "top-0.5 left-0.5",
        border: "border",
        tab: "w-3 h-2",
        tabPos: "-translate-y-0.5",
        icon: "text-xs",
        iconPos: "-top-1",
    },
    md: {
        plate: "w-20 h-12",
        text: "text-sm",
        bolt: "w-2 h-2",
        boltPos: "top-1 left-1",
        border: "border-2",
        tab: "w-4 h-3",
        tabPos: "-translate-y-1",
        icon: "text-sm",
        iconPos: "-top-2",
    },
    lg: {
        plate: "w-28 h-16",
        text: "text-lg",
        bolt: "w-2.5 h-2.5",
        boltPos: "top-1.5 left-1.5",
        border: "border-2",
        tab: "w-5 h-4",
        tabPos: "-translate-y-1",
        icon: "text-base",
        iconPos: "-top-2",
    },
} as const;

export type VRTierSize = keyof typeof VR_TIER_SIZES;

export const SECTION_COLORS: Record<string, { color: string; accent: string; shadowColor: string }> = {
    "Project Leader": {
        color: "text-red-600 dark:text-red-400",
        accent: "border-red-500",
        shadowColor: "220, 38, 38",
    },
    "Team Retro WFC": {
        color: "text-cyan-600 dark:text-cyan-400",
        accent: "border-cyan-500",
        shadowColor: "8, 145, 178",
    },
    "Team WheelWizard": {
        color: "text-purple-600 dark:text-purple-400",
        accent: "border-purple-500",
        shadowColor: "147, 51, 234",
    },
    "Website Creator": {
        color: "text-indigo-600 dark:text-indigo-400",
        accent: "border-indigo-500",
        shadowColor: "79, 70, 229",
    },
    Administrators: {
        color: "text-orange-600 dark:text-orange-400",
        accent: "border-orange-500",
        shadowColor: "234, 88, 12",
    },
    Moderators: {
        color: "text-emerald-600 dark:text-emerald-400",
        accent: "border-emerald-500",
        shadowColor: "5, 150, 105",
    },
    "Community Staff": {
        color: "text-teal-600 dark:text-teal-400",
        accent: "border-teal-500",
        shadowColor: "13, 148, 136",
    },
    "RWFC Moderators": {
        color: "text-amber-600 dark:text-amber-400",
        accent: "border-amber-500",
        shadowColor: "217, 119, 6",
    },
    Developers: {
        color: "text-yellow-600 dark:text-yellow-400",
        accent: "border-yellow-500",
        shadowColor: "202, 138, 4",
    },
    Translators: {
        color: "text-violet-600 dark:text-violet-400",
        accent: "border-violet-500",
        shadowColor: "124, 58, 237",
    },
    "BKT Updaters": {
        color: "text-pink-600 dark:text-pink-400",
        accent: "border-pink-500",
        shadowColor: "219, 39, 119",
    },
    "Mogi Staff": {
        color: "text-pink-600 dark:text-pink-400",
        accent: "border-pink-500",
        shadowColor: "219, 39, 119",
    },
    "Mogi Updaters": {
        color: "text-sky-600 dark:text-sky-400",
        accent: "border-sky-500",
        shadowColor: "2, 132, 199",
    },
};