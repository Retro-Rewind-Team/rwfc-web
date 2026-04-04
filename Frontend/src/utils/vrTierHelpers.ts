import {
    GLOW_TIERS,
    ICON_TIERS,
    SUSPICIOUS_TIER,
    TROPHY_RANKS,
    VR_TIER_STYLES,
    VR_TIERS,
} from "./vrTiers";
import { VRTierInfo } from "../types";

/** Returns the VR tier info for a given VR value, or the suspicious tier if flagged. */
export function getVRTierInfo(vr: number, isSuspicious: boolean = false): VRTierInfo {
    if (isSuspicious) return SUSPICIOUS_TIER;

    for (const tier of VR_TIERS) {
        if (vr >= tier.minVR && (tier.maxVR === null || vr <= tier.maxVR)) return tier;
    }

    return VR_TIERS[VR_TIERS.length - 1];
}

/** Returns the next higher VR tier above `currentVR`, or null if already at the top. */
export function getNextVRTier(currentVR: number, isSuspicious: boolean = false): VRTierInfo | null {
    if (isSuspicious) return null;

    let nextTier: VRTierInfo | null = null;
    let smallestGap = Infinity;

    for (const tier of VR_TIERS) {
        if (tier.minVR > currentVR) {
            const gap = tier.minVR - currentVR;
            if (gap < smallestGap) {
                smallestGap = gap;
                nextTier = tier;
            }
        }
    }

    return nextTier;
}

/** Returns the number of VR points needed to reach the next tier (0 if already at max). */
export function getVRNeededForNextTier(currentVR: number, isSuspicious: boolean = false): number {
    const nextTier = getNextVRTier(currentVR, isSuspicious);
    return nextTier ? nextTier.minVR - currentVR : 0;
}

/** Returns a 0–1 progress fraction within the current tier towards the next. */
export function getTierProgress(vr: number, isSuspicious: boolean = false): number {
    if (isSuspicious) return 0;

    const currentTier = getVRTierInfo(vr, isSuspicious);
    const nextTier = getNextVRTier(vr, isSuspicious);

    if (!nextTier) return 1;

    const tierStart = currentTier.minVR;
    const nextTierStart = nextTier.minVR;
    const tierRange = nextTierStart - tierStart;
    const currentProgress = vr - tierStart;

    return Math.min(Math.max(currentProgress / tierRange, 0), 1);
}

/** Returns the full ordered list of VR tiers. */
export function getAllVRTiers(): readonly VRTierInfo[] {
    return VR_TIERS;
}

/** Returns true if the tier name is one of the tiers that render a glow/pulse animation. */
export function tierHasGlow(tierName: string): boolean {
    return GLOW_TIERS.includes(tierName as (typeof GLOW_TIERS)[number]);
}

/** Returns true if the tier name has a dedicated tab colour in VR_TIER_STYLES. */
export function tierHasTab(tierName: string): boolean {
    return Object.keys(VR_TIER_STYLES.TAB_COLORS).includes(tierName);
}

/** Returns true if the tier name is one of the tiers that render an icon on the number plate. */
export function tierHasIcon(tierName: string): boolean {
    return ICON_TIERS.includes(tierName as (typeof ICON_TIERS)[number]);
}

/** Returns a display string for the VR range of a tier, e.g. "5,000 - 9,999 VR" or "50,000+ VR". */
export function formatVRRange(tier: VRTierInfo): string {
    if (tier.maxVR === null) return `${tier.minVR.toLocaleString()}+ VR`;
    return `${tier.minVR.toLocaleString()} - ${tier.maxVR.toLocaleString()} VR`;
}

/** Returns true if the rank is 1, 2, or 3 (receives special gold/silver/bronze styling). */
export function isTopThreeRank(rank: number): boolean {
    return rank >= 1 && rank <= 3;
}

/** Returns the gold/silver/bronze trophy emoji for ranks 1–3, or null for all others. */
export function getTrophyIcon(rank: number): string | null {
    switch (rank) {
        case TROPHY_RANKS.FIRST:
            return "🥇";
        case TROPHY_RANKS.SECOND:
            return "🥈";
        case TROPHY_RANKS.THIRD:
            return "🥉";
        default:
            return null;
    }
}
