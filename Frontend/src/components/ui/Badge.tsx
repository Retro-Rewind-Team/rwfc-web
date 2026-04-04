import { createSignal, Show } from "solid-js";
import { badgeInfo, type BadgeType } from "../../constants/badgeData";
import WhWzDevBadge from "./badges/WhWzDevBadge";
import RrDevBadge from "./badges/RrDevBadge";
import TranslatorBadge from "./badges/TranslatorBadge";
import TranslatorLeadBadge from "./badges/TranslatorLeadBadge";
import MedalBadge from "./badges/MedalBadge";

interface BadgeProps {
    variant: BadgeType;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

function BadgeSVG(props: { variant: BadgeType }) {
    switch (props.variant) {
        case "WhWzDev":
            return <WhWzDevBadge />;
        case "RrDev":
            return <RrDevBadge />;
        case "Translator":
            return <TranslatorBadge />;
        case "TranslatorLead":
            return <TranslatorLeadBadge />;
        default:
            return <MedalBadge variant={props.variant} />;
    }
}

export default function Badge(props: BadgeProps) {
    const size = () => props.size || "sm";
    const info = () => badgeInfo[props.variant];

    const [showTooltip, setShowTooltip] = createSignal(false);

    const isMobile = () => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < 768 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    };

    const sizeClass = () => {
        switch (size()) {
            case "sm":
                return "w-7 h-7";
            case "md":
                return "w-9 h-9";
            case "lg":
                return "w-12 h-12";
        }
    };

    const handleClick = (e: MouseEvent) => {
        if (isMobile()) {
            e.stopPropagation();
            setShowTooltip(!showTooltip());
        }
    };

    const handleMouseEnter = () => {
        if (!isMobile()) setShowTooltip(true);
    };
    const handleMouseLeave = () => {
        if (!isMobile()) setShowTooltip(false);
    };

    return (
        <div class="relative inline-flex items-center gap-2 group">
            <div
                class={`${sizeClass()} flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 hover:shadow-xl cursor-pointer`}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <BadgeSVG variant={props.variant} />
            </div>

            {/* Tooltip */}
            <Show when={showTooltip()}>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        {info().tooltip}
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                            <div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                    </div>
                </div>
            </Show>

            {/* Label */}
            <Show when={props.showLabel}>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
                    {info().label}
                </span>
            </Show>
        </div>
    );
}
