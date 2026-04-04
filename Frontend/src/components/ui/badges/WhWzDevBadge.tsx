export default function WhWzDevBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="ww-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#93C5FD;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#ww-grad)"
                stroke="#0C1E4A"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(191, 219, 254, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#1E3A8A" stroke="#0C1E4A" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g
                stroke="#60A5FA"
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
