import { Show } from "solid-js";
import {
    getTrophyIcon,
    getVRTierInfo,
    isTopThreeRank,
    tierHasGlow,
    tierHasIcon,
} from "../../utils/vrTierHelpers";
import { VR_TIER_STYLES } from "../../utils/vrTiers";
import { VR_TIER_SIZES, type VRTierSize } from "../../utils/constants";

interface VRTierNumberPlateProps {
  rank: number;
  vr: number;
  isSuspicious?: boolean;
  size?: VRTierSize;
  className?: string;
}

export default function VRTierNumberPlate(props: VRTierNumberPlateProps) {
    const tier = () => getVRTierInfo(props.vr, props.isSuspicious);
    const size = () => props.size || "md";
    const config = () => VR_TIER_SIZES[size()];
    const isTopThree = () => isTopThreeRank(props.rank);
    const trophyIcon = () => getTrophyIcon(props.rank);

    const getSpecialTopThreeGradient = (rank: number) => {
        switch (rank) {
        case 1:
            return "from-yellow-400 via-yellow-500 to-amber-500"; // Gold
        case 2:
            return "from-gray-300 via-gray-400 to-gray-500"; // Silver
        case 3:
            return "from-orange-400 via-orange-500 to-amber-600"; // Bronze
        default:
            return tier().gradient;
        }
    };

    const getMaximumTierGradient = () => {
        return "from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500";
    };

    const plateClasses = () => {
        let gradient = tier().gradient;

        if (isTopThree()) {
            gradient = getSpecialTopThreeGradient(props.rank);
        } else if (tier().tier === "master") {
            gradient = getMaximumTierGradient();
        }

        const baseClasses = `relative bg-gradient-to-br ${gradient} rounded-lg ${config().border} ${config().plate} flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl`;

        if (tierHasGlow(tier().tier) || isTopThree()) {
            return `${baseClasses} animate-pulse`;
        }

        return baseClasses;
    };

    const borderColor = () => {
        if (isTopThree()) {
            switch (props.rank) {
            case 1:
                return "border-yellow-200";
            case 2:
                return "border-gray-200";
            case 3:
                return "border-orange-200";
            }
        }
        return VR_TIER_STYLES.BORDER_COLORS[
      tier().tier as keyof typeof VR_TIER_STYLES.BORDER_COLORS
        ];
    };

    const shouldShowIcon = () => tierHasIcon(tier().tier) || isTopThree();

    const getTextStyling = () => {
        const baseText = `text-white font-black ${config().text} select-none tracking-tight`;

        if (isTopThree() || tierHasGlow(tier().tier)) {
            return `${baseText} drop-shadow-lg`;
        }

        return `${baseText} drop-shadow-md`;
    };

    const titlePrefix = isTopThree() ? `#${props.rank} Overall - ` : "";

    return (
        <div
            class={`inline-block ${props.className || ""}`}
            title={`${titlePrefix}${tier().label} Tier (${props.vr.toLocaleString()} VR)`}
        >
            <div class={`${plateClasses()} ${borderColor()}`}>
                <div class="absolute inset-1 border border-white/20 rounded-md pointer-events-none"></div>

                {/* Icon for special tiers or top 3 ranks */}
                <Show when={shouldShowIcon()}>
                    <div
                        class={`absolute ${config().iconPos} left-1/2 transform -translate-x-1/2 ${config().icon} drop-shadow-md`}
                    >
                        <Show when={isTopThree()} fallback={tier().icon}>
                            {trophyIcon()}
                        </Show>
                    </div>
                </Show>

                {/* Enhanced Rank Number */}
                <span class={getTextStyling()}>
                    <Show when={props.isSuspicious} fallback={`#${props.rank}`}>
            ?
                    </Show>
                </span>

                {/* Special Glow Effects */}
                <Show when={tierHasGlow(tier().tier) || isTopThree()}>
                    <Show
                        when={tier().tier === "master"}
                        fallback={
                            <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 via-white/10 to-white/5 animate-pulse pointer-events-none"></div>
                        }
                    >
                        {/* Rainbow glow for master tier */}
                        <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-red-400/10 via-yellow-400/10 via-green-400/10 via-blue-400/10 to-purple-400/10 animate-pulse pointer-events-none"></div>
                    </Show>
                </Show>

                {/* Premium shine effect for top tiers */}
                <Show
                    when={isTopThree() || ["master", "legendary"].includes(tier().tier)}
                >
                    <div class="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none"></div>
                </Show>
            </div>
        </div>
    );
}
