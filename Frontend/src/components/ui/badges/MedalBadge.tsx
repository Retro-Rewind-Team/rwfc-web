import type { BadgeType } from "../../../constants/badgeData";

type MedalVariant = Exclude<BadgeType, "WhWzDev" | "RrDev" | "Translator" | "TranslatorLead">;

interface MedalBadgeProps {
    variant: MedalVariant;
}

export default function MedalBadge(props: MedalBadgeProps) {
    const isGold = () => props.variant.includes("Gold");
    const isSilver = () => props.variant.includes("Silver");

    const colors = () =>
        isGold()
            ? {
                outer: ["#FEF08A", "#FBBF24", "#D97706"],
                glow: "rgba(253, 224, 71, 0.3)",
                inner: "#92400E",
                border: "#78350F",
                bright: "#FDE047",
            }
            : isSilver()
                ? {
                    outer: ["#F3F4F6", "#9CA3AF", "#6B7280"],
                    glow: "rgba(229, 231, 235, 0.3)",
                    inner: "#4B5563",
                    border: "#374151",
                    bright: "#E5E7EB",
                }
                : {
                    outer: ["#FDBA74", "#FB923C", "#EA580C"],
                    glow: "rgba(253, 186, 116, 0.3)",
                    inner: "#9A3412",
                    border: "#7C2D12",
                    bright: "#FED7AA",
                };

    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-xl">
            <defs>
                <linearGradient id={`medal-grad-${props.variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={`stop-color:${colors().outer[0]};stop-opacity:1`} />
                    <stop offset="50%" style={`stop-color:${colors().outer[1]};stop-opacity:1`} />
                    <stop offset="100%" style={`stop-color:${colors().outer[2]};stop-opacity:1`} />
                </linearGradient>
            </defs>

            <g transform="rotate(21 8 8)">
                <path
                    d="M6 3 L6 9.5 L8 8 L10 9.5 L10 3 Z"
                    fill={`url(#medal-grad-${props.variant})`}
                    stroke={colors().border}
                    stroke-width="0.4"
                />
                <circle cx="8" cy="10.5" r="3.5" fill={`url(#medal-grad-${props.variant})`} stroke={colors().border} stroke-width="0.4" />
                <circle cx="8" cy="10.5" r="3.2" fill="none" stroke={colors().glow} stroke-width="0.3" />
                <circle cx="8" cy="10.5" r="2.6" fill={colors().inner} stroke={colors().border} stroke-width="0.3" />
                <path d="M 6.5 9 Q 8 9.5, 9.5 9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4" />
                <circle cx="8" cy="10.5" r="1.2" fill={colors().bright} stroke={colors().border} stroke-width="0.2" />
            </g>
        </svg>
    );
}
