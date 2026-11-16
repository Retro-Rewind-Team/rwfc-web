import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
    formatVRRange,
    getNextVRTier,
    getTierProgress,
    getVRNeededForNextTier,
    getVRTierInfo,
} from "../../../utils/vrTierHelpers";
import { VR_TIER_STYLES } from "../../../utils/vrTiers";
import { Star } from "lucide-solid/icons/index";

interface VRTierInfoProps {
    vr: number;
    isSuspicious?: boolean;
    showProgress?: boolean;
    className?: string;
}

export default function VRTierInfo(props: Readonly<VRTierInfoProps>) {
    const currentTier = () => getVRTierInfo(props.vr, props.isSuspicious);
    const nextTier = () => getNextVRTier(props.vr, props.isSuspicious);
    const vrNeeded = () => getVRNeededForNextTier(props.vr, props.isSuspicious);
    const progress = () => getTierProgress(props.vr, props.isSuspicious);
    const showProgress = () => props.showProgress !== false;

    // Solid fill keyed to the next tier; the design system has no gradients.
    const barColor = () => {
        const next = nextTier();
        if (!next) return VR_TIER_STYLES.BAR_COLORS.legend;
        return (
            VR_TIER_STYLES.BAR_COLORS[next.tier as keyof typeof VR_TIER_STYLES.BAR_COLORS] ??
            VR_TIER_STYLES.BAR_COLORS.beginner
        );
    };

    return (
        <div class={`${props.className || ""}`}>
            {/* Current Tier Info */}
            <div class="flex items-center space-x-2 mb-2">
                <Dynamic
                    component={currentTier().icon}
                    size={22}
                    class={currentTier().iconColor}
                    stroke-width={2.5}
                />
                <div>
                    <div class="font-semibold text-gray-900 dark:text-white">
                        {currentTier().label} Tier
                    </div>
                </div>
            </div>

            {/* Progress Bar and Next Tier */}
            <Show when={showProgress() && nextTier() && !props.isSuspicious}>
                <div class="space-y-2">
                    {/* Progress Bar */}
                    <div class="h-2 w-full overflow-hidden rounded-full bg-surface">
                        {/* scaleX instead of width: only transform and opacity are animated. */}
                        <div
                            class={`${barColor()} h-2 w-full origin-left rounded-full transition-transform duration-(--motion-slow)`}
                            style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress()))})` }}
                        ></div>
                    </div>

                    {/* Next Tier Info */}
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600 dark:text-gray-400">
                            Progress to {nextTier()!.label}
                        </span>
                        <span class="font-medium text-gray-900 dark:text-white">
                            {vrNeeded().toLocaleString()} VR needed
                        </span>
                    </div>
                </div>
            </Show>

            {/* Already at Max Tier */}
            <Show when={!nextTier() && !props.isSuspicious}>
                <div class="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                    <Star size={16} />
                    <span class="font-medium">Maximum tier reached - VR cap achieved!</span>
                </div>
            </Show>

            {/* VR Range Info */}
            <Show when={!props.isSuspicious}>
                <div class="mt-3 text-xs text-fg-subtle">{formatVRRange(currentTier())}</div>
            </Show>
        </div>
    );
}
