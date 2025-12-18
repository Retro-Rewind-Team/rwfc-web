import { createSignal, Show } from "solid-js";
import type { BadgeType } from "../../utils/badgeData";
import { badgeInfo } from "../../utils/badgeData";

interface BadgeProps {
    variant: BadgeType;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export default function Badge(props: BadgeProps) {
    const size = () => props.size || "sm";
    const info = () => badgeInfo[props.variant];
    
    const [showTooltip, setShowTooltip] = createSignal(false);
    
    // Detect mobile
    const isMobile = () => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < 768 || ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    };
    
    // Size classes
    const sizeClass = () => {
        switch (size()) {
        case "sm": return "w-7 h-7";
        case "md": return "w-9 h-9";
        case "lg": return "w-12 h-12";
        }
    };

    const handleClick = (e: MouseEvent) => {
        if (isMobile()) {
            e.stopPropagation();
            setShowTooltip(!showTooltip());
        }
    };

    const handleMouseEnter = () => {
        if (!isMobile()) {
            setShowTooltip(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile()) {
            setShowTooltip(false);
        }
    };

    const BadgeSVG = () => {
        const variant = props.variant;

        // WheelWizard Developer
        if (variant === "WhWzDev") {
            return (
                <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="ww-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#93C5FD;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main circle with gradient */}
                    <circle cx="8" cy="8" r="7.5" fill="url(#ww-grad)" stroke="#0C1E4A" stroke-width="0.4"/>
                    
                    {/* Inner glow border */}
                    <circle cx="8" cy="8" r="7.1" fill="none" stroke="rgba(191, 219, 254, 0.3)" stroke-width="0.3"/>
                    
                    {/* Inner circle */}
                    <circle cx="8" cy="8" r="6" fill="#1E3A8A" stroke="#0C1E4A" stroke-width="0.3"/>
                    
                    {/* Premium shine effect */}
                    <path d="M 3 3 Q 8 5, 13 3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
                    
                    {/* Code icon */}
                    <g stroke="#60A5FA" stroke-width="1.4" stroke-linecap="round" fill="none" class="drop-shadow-md">
                        <path d="M4.5 5.5L3 8L4.5 10.5"/>
                        <path d="M11.5 5.5L13 8L11.5 10.5"/>
                        <line x1="9.5" y1="5" x2="6.5" y2="11"/>
                    </g>
                </svg>
            );
        }

        // Retro Rewind Developer
        if (variant === "RrDev") {
            return (
                <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="rr-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#FCD34D;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#F59E0B;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main circle */}
                    <circle cx="8" cy="8" r="7.5" fill="url(#rr-grad)" stroke="#78350F" stroke-width="0.4"/>
                    
                    {/* Inner glow border */}
                    <circle cx="8" cy="8" r="7.1" fill="none" stroke="rgba(253, 224, 71, 0.3)" stroke-width="0.3"/>
                    
                    {/* Inner circle */}
                    <circle cx="8" cy="8" r="6" fill="#92400E" stroke="#78350F" stroke-width="0.3"/>
                    
                    {/* Premium shine */}
                    <path d="M 3 3 Q 8 5, 13 3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
                    
                    {/* Code icon */}
                    <g stroke="#FBBF24" stroke-width="1.4" stroke-linecap="round" fill="none" class="drop-shadow-md">
                        <path d="M4.5 5.5L3 8L4.5 10.5"/>
                        <path d="M11.5 5.5L13 8L11.5 10.5"/>
                        <line x1="9.5" y1="5" x2="6.5" y2="11"/>
                    </g>
                </svg>
            );
        }

        // Translator
        if (variant === "Translator") {
            return (
                <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="trans-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#C4B5FD;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#6D28D9;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main circle */}
                    <circle cx="8" cy="8" r="7.5" fill="url(#trans-grad)" stroke="#4C1D95" stroke-width="0.4"/>
                    
                    {/* Inner glow border */}
                    <circle cx="8" cy="8" r="7.1" fill="none" stroke="rgba(196, 181, 253, 0.3)" stroke-width="0.3"/>
                    
                    {/* Inner circle */}
                    <circle cx="8" cy="8" r="6" fill="#5B21B6" stroke="#4C1D95" stroke-width="0.3"/>
                    
                    {/* Premium shine */}
                    <path d="M 3 3 Q 8 5, 13 3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
                    
                    {/* Globe icon */}
                    <g stroke="#DDD6FE" stroke-width="1" fill="none" class="drop-shadow-md">
                        {/* Outer circle */}
                        <circle cx="8" cy="8" r="3.5"/>
                        {/* Vertical ellipse*/}
                        <ellipse cx="8" cy="8" rx="1.5" ry="3.5"/>
                        {/* Horizontal line */}
                        <line x1="4.5" y1="8" x2="11.5" y2="8"/>
                        {/* Top curved line */}
                        <path d="M5.5 5.5 Q8 6 10.5 5.5"/>
                        {/* Bottom curved line */}
                        <path d="M5.5 10.5 Q8 10 10.5 10.5"/>
                    </g>
                </svg>
            );
        }

        // Translation Leader
        if (variant === "TranslatorLead") {
            return (
                <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="lead-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#FBCFE8;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#EC4899;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#BE185D;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main circle */}
                    <circle cx="8" cy="8" r="7.5" fill="url(#lead-grad)" stroke="#831843" stroke-width="0.4"/>
                    
                    {/* Inner glow border */}
                    <circle cx="8" cy="8" r="7.1" fill="none" stroke="rgba(251, 207, 232, 0.3)" stroke-width="0.3"/>
                    
                    {/* Inner circle */}
                    <circle cx="8" cy="8" r="6" fill="#9F1239" stroke="#831843" stroke-width="0.3"/>
                    
                    {/* Premium shine */}
                    <path d="M 3 3 Q 8 5, 13 3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
                    
                    {/* Star integrated at top */}
                    <path
                        d="M8 3.5L8.6 5.2L10.3 5.2L9 6.2L9.6 7.9L8 6.9L6.4 7.9L7 6.2L5.7 5.2L7.4 5.2Z"
                        fill="#FDE047"
                        stroke="#CA8A04"
                        stroke-width="0.3"
                        class="drop-shadow-md"
                    />
                    
                    {/* Globe icon below star */}
                    <g stroke="#FBCFE8" stroke-width="0.8" fill="none" class="drop-shadow-md">
                        {/* Outer circle */}
                        <circle cx="8" cy="10.5" r="2.5"/>
                        {/* Vertical ellipse */}
                        <ellipse cx="8" cy="10.5" rx="1" ry="2.5"/>
                        {/* Horizontal line */}
                        <line x1="5.5" y1="10.5" x2="10.5" y2="10.5"/>
                        {/* Top curved line */}
                        <path d="M6.2 8.8 Q8 9.2 9.8 8.8"/>
                        {/* Bottom curved line */}
                        <path d="M6.2 12.2 Q8 11.8 9.8 12.2"/>
                    </g>
                </svg>
            );
        }

        // Tournament Badges
        const isGold = variant.includes("Gold");
        const isSilver = variant.includes("Silver");

        const colors = isGold
            ? { 
                outer: ["#FEF08A", "#FBBF24", "#D97706"],
                glow: "rgba(253, 224, 71, 0.3)",
                inner: "#92400E",
                border: "#78350F",
                bright: "#FDE047"
            }
            : isSilver
                ? { 
                    outer: ["#F3F4F6", "#9CA3AF", "#6B7280"],
                    glow: "rgba(229, 231, 235, 0.3)",
                    inner: "#4B5563",
                    border: "#374151",
                    bright: "#E5E7EB"
                }
                : { 
                    outer: ["#FDBA74", "#FB923C", "#EA580C"],
                    glow: "rgba(253, 186, 116, 0.3)",
                    inner: "#9A3412",
                    border: "#7C2D12",
                    bright: "#FED7AA"
                };

        return (
            <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-xl">
                <defs>
                    <linearGradient id={`medal-grad-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={`stop-color:${colors.outer[0]};stop-opacity:1`} />
                        <stop offset="50%" style={`stop-color:${colors.outer[1]};stop-opacity:1`} />
                        <stop offset="100%" style={`stop-color:${colors.outer[2]};stop-opacity:1`} />
                    </linearGradient>
                </defs>
                
                {/* Medal + Ribbon */}
                <g transform="rotate(21 8 8)">
                    {/* Ribbon */}
                    <path
                        d="M6 3 L6 9.5 L8 8 L10 9.5 L10 3 Z"
                        fill={`url(#medal-grad-${variant})`}
                        stroke={colors.border}
                        stroke-width="0.4"
                    />
                    
                    {/* Medal outer circle */}
                    <circle 
                        cx="8" 
                        cy="10.5" 
                        r="3.5" 
                        fill={`url(#medal-grad-${variant})`}
                        stroke={colors.border}
                        stroke-width="0.4"
                    />
                    
                    {/* Inner glow border */}
                    <circle 
                        cx="8" 
                        cy="10.5" 
                        r="3.2" 
                        fill="none"
                        stroke={colors.glow}
                        stroke-width="0.3"
                    />
                    
                    {/* Inner dark circle */}
                    <circle 
                        cx="8" 
                        cy="10.5" 
                        r="2.6" 
                        fill={colors.inner}
                        stroke={colors.border}
                        stroke-width="0.3"
                    />
                    
                    {/* Premium shine */}
                    <path d="M 6.5 9 Q 8 9.5, 9.5 9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
                    
                    {/* Center detail */}
                    <circle 
                        cx="8" 
                        cy="10.5" 
                        r="1.2" 
                        fill={colors.bright}
                        stroke={colors.border}
                        stroke-width="0.2"
                    />
                </g>
            </svg>
        );
    };

    return (
        <div class="relative inline-flex items-center gap-2 group">
            <div 
                class={`${sizeClass()} flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 hover:shadow-xl cursor-pointer`}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <BadgeSVG />
            </div>
            
            {/* Tooltip */}
            <Show when={showTooltip()}>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        {info().tooltip}
                        {/* Arrow */}
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                            <div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
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