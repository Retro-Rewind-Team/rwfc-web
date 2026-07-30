export default function SupporterBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="supporter-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FDA4AF;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#F43F5E;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#BE123C;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#supporter-grad)"
                stroke="#881337"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(253, 164, 175, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#9F1239" stroke="#881337" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g stroke="#FECDD3" stroke-width="1" fill="none" class="drop-shadow-md">
                <rect x="4.5" y="7" width="7" height="5" rx="0.4" />
                <line x1="4.5" y1="9" x2="11.5" y2="9" stroke-width="0.8" />
                <line x1="8" y1="7" x2="8" y2="12" stroke-width="0.8" />
                <path d="M8 7 C7 5.5 5.5 5.5 5.5 6.5 C5.5 7.3 7 7 8 7 Z" />
                <path d="M8 7 C9 5.5 10.5 5.5 10.5 6.5 C10.5 7.3 9 7 8 7 Z" />
            </g>
        </svg>
    );
}
