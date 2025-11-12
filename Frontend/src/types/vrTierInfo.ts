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