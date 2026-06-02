import type { LucideIcon } from "lucide-solid";

export interface VRTierInfo {
    tier: string;
    gradient: string;
    glow: boolean;
    icon: LucideIcon;
    iconColor: string;
    label: string;
    minVR: number;
    maxVR: number | null;
}
