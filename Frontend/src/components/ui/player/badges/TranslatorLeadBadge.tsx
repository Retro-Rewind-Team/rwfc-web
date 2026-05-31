export default function TranslatorLeadBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="lead-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FBCFE8;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#EC4899;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#BE185D;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#lead-grad)"
                stroke="#831843"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(251, 207, 232, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#9F1239" stroke="#831843" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <path
                d="M8 3.5L8.6 5.2L10.3 5.2L9 6.2L9.6 7.9L8 6.9L6.4 7.9L7 6.2L5.7 5.2L7.4 5.2Z"
                fill="#FDE047"
                stroke="#CA8A04"
                stroke-width="0.3"
                class="drop-shadow-md"
            />

            <g stroke="#FBCFE8" stroke-width="0.8" fill="none" class="drop-shadow-md">
                <circle cx="8" cy="10.5" r="2.5" />
                <ellipse cx="8" cy="10.5" rx="1" ry="2.5" />
                <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" />
                <path d="M6.2 8.8 Q8 9.2 9.8 8.8" />
                <path d="M6.2 12.2 Q8 11.8 9.8 12.2" />
            </g>
        </svg>
    );
}
