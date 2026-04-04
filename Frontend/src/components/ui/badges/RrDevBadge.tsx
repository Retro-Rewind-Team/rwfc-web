export default function RrDevBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="rr-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FCD34D;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#F59E0B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#rr-grad)"
                stroke="#78350F"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(253, 224, 71, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#92400E" stroke="#78350F" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g
                stroke="#FBBF24"
                stroke-width="1.4"
                stroke-linecap="round"
                fill="none"
                class="drop-shadow-md"
            >
                <path d="M4.5 5.5L3 8L4.5 10.5" />
                <path d="M11.5 5.5L13 8L11.5 10.5" />
                <line x1="9.5" y1="5" x2="6.5" y2="11" />
            </g>
        </svg>
    );
}
