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
