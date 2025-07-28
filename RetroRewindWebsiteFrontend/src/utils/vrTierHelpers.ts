import {
  VR_TIERS,
  SUSPICIOUS_TIER,
  TROPHY_RANKS,
  type VRTierInfo,
} from "./vrTiers";

export function getVRTierInfo(
  vr: number,
  isSuspicious: boolean = false
): VRTierInfo {
  if (isSuspicious) {
    return SUSPICIOUS_TIER;
  }

  for (const tier of VR_TIERS) {
    if (vr >= tier.minVR && (tier.maxVR === null || vr <= tier.maxVR)) {
      return tier;
    }
  }

  return VR_TIERS[VR_TIERS.length - 1];
}

export function isTopThreeRank(rank: number): boolean {
  return rank >= 1 && rank <= 3;
}

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

export function getNextVRTier(
  currentVR: number,
  isSuspicious: boolean = false
): VRTierInfo | null {
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

export function getVRNeededForNextTier(
  currentVR: number,
  isSuspicious: boolean = false
): number {
  const nextTier = getNextVRTier(currentVR, isSuspicious);
  return nextTier ? nextTier.minVR - currentVR : 0;
}

export function getTierProgress(
  vr: number,
  isSuspicious: boolean = false
): number {
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

export function getAllVRTiers(): readonly VRTierInfo[] {
  return VR_TIERS;
}

export function tierHasGlow(tierName: string): boolean {
  return ["maximum", "legendary", "grandmaster"].includes(tierName);
}

export function tierHasTab(tierName: string): boolean {
  return [
    "master",
    "legendary",
    "elite",
    "hero",
    "elite",
    "veteran",
    "beast",
    "mythic",
  ].includes(tierName);
}

export function tierHasIcon(tierName: string): boolean {
  return ["master", "legendary", "elite", "mythic"].includes(tierName);
}

export function formatVRRange(tier: VRTierInfo): string {
  if (tier.maxVR === null) {
    return `${tier.minVR.toLocaleString()}+ VR`;
  }
  return `${tier.minVR.toLocaleString()} - ${tier.maxVR.toLocaleString()} VR`;
}
