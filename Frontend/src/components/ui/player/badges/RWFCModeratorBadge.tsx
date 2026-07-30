export default function RWFCModeratorBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="rwfc-mod-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#CBD5E1;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#64748B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#rwfc-mod-grad)"
                stroke="#0F172A"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(203, 213, 225, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#1E293B" stroke="#0F172A" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g stroke="#E2E8F0" stroke-width="1" fill="none" class="drop-shadow-md">
                <path d="M8 4 L11 5.2 V8.3 C11 10.3 9.7 11.6 8 12.2 C6.3 11.6 5 10.3 5 8.3 V5.2 Z" />
                <path d="M6.4 8.3 L7.4 9.3 L9.7 6.7" stroke-width="0.9" />
            </g>
        </svg>
    );
}
