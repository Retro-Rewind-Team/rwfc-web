import { Show } from "solid-js";
import {
    formatVRRange,
    getNextVRTier,
    getTierProgress,
    getVRNeededForNextTier,
    getVRTierInfo,
} from "../../utils/vrTierHelpers";

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

    // Get appropriate gradient for progress bar based on next tier
    const getProgressBarGradient = () => {
        const next = nextTier();
        if (!next) return "bg-gradient-to-r from-amber-400 to-yellow-500";

        switch (next.tier) {
        case "master":
            return "bg-gradient-to-r from-purple-500 via-blue-500 to-green-500";
        case "legendary":
            return "bg-gradient-to-r from-amber-400 to-yellow-500";
        case "elite":
            return "bg-gradient-to-r from-purple-400 to-pink-500";
        case "hero":
            return "bg-gradient-to-r from-indigo-500 to-cyan-500";
        case "veteran":
            return "bg-gradient-to-r from-emerald-500 to-teal-500";
        case "beast":
            return "bg-gradient-to-r from-yellow-400 to-yellow-600";
        case "expert":
            return "bg-gradient-to-r from-orange-500 to-red-600";
        case "advanced":
            return "bg-gradient-to-r from-purple-500 to-purple-700";
        case "intermediate":
            return "bg-gradient-to-r from-blue-500 to-blue-700";
        case "beginner":
            return "bg-gradient-to-r from-gray-400 to-gray-600";
        case "suspicious":
            return "bg-gradient-to-r from-red-500 to-red-700";
        default:
            return "bg-gradient-to-r from-blue-500 to-purple-600";
        }
    };

    return (
        <div class={`${props.className || ""}`}>
            {/* Current Tier Info */}
            <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">{currentTier().icon}</span>
                <div>
                    <div class="font-semibold text-gray-900 dark:text-white">
                        {currentTier().label} Tier
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        {currentTier().description}
                    </div>
                </div>
            </div>

            {/* Progress Bar and Next Tier */}
            <Show when={showProgress() && nextTier() && !props.isSuspicious}>
                <div class="space-y-2">
                    {/* Progress Bar */}
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            class={`${getProgressBarGradient()} h-2 rounded-full transition-all duration-500`}
                            style={`width: ${Math.round(progress() * 100)}%`}
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
                    <span>💫</span>
                    <span class="font-medium">
            Maximum tier reached - VR cap achieved!
                    </span>
                </div>
            </Show>

            {/* VR Range Info */}
            <Show when={!props.isSuspicious}>
                <div class="mt-3 text-xs text-gray-500 dark:text-gray-500">
                    {formatVRRange(currentTier())}
                </div>
            </Show>
        </div>
    );
}
