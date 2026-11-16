import { Show } from "solid-js";
import { getVRTierInfo, isTopThreeRank } from "../../../utils/vrTierHelpers";
import { VR_TIER_STYLES } from "../../../utils/vrTiers";
import { VR_TIER_SIZES, type VRTierSize } from "../../../utils/constants";
import Tooltip from "../../common/Tooltip";

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

    // Solid fills: the design system has no gradients, glows or looping animation. Tier is still
    // told apart by colour, and the tooltip carries the name for anyone who can't see it.
    const plateColor = () => {
        if (isTopThree()) {
            return VR_TIER_STYLES.PLATE_COLORS[`rank${props.rank}` as "rank1" | "rank2" | "rank3"];
        }
        return VR_TIER_STYLES.PLATE_COLORS[tier().tier as keyof typeof VR_TIER_STYLES.PLATE_COLORS];
    };

    const plateClasses = () =>
        `relative ${plateColor()} rounded-lg ${config().border} ${config().plate} flex items-center justify-center`;

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

    const textClasses = () => `text-white font-black ${config().text} select-none tracking-tight`;

    const tooltipText = () =>
        `${isTopThree() ? `#${props.rank} Overall - ` : ""}${tier().label} Tier (${props.vr.toLocaleString()} VR)`;

    return (
        <Tooltip text={tooltipText()} class={props.className}>
            <div class="inline-block">
                <div class={`${plateClasses()} ${borderColor()}`}>
                    <div class="absolute inset-1 border border-white/20 rounded-md pointer-events-none"></div>

                    <span class={textClasses()}>
                        <Show when={props.isSuspicious} fallback={`#${props.rank}`}>
                            ?
                        </Show>
                    </span>
                </div>
            </div>
        </Tooltip>
    );
}
