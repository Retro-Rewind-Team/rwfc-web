export default function ContributorBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="contributor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#6EE7B7;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#10B981;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#contributor-grad)"
                stroke="#064E3B"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(110, 231, 183, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#065F46" stroke="#064E3B" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g
                stroke="#A7F3D0"
                stroke-width="1.3"
                stroke-linecap="round"
                fill="none"
                class="drop-shadow-md"
            >
                <line x1="8" y1="4" x2="8" y2="6.8" />
                <line x1="8" y1="9.2" x2="8" y2="12" />
                <line x1="4" y1="8" x2="6.8" y2="8" />
                <line x1="9.2" y1="8" x2="12" y2="8" />
                <line x1="5.3" y1="5.3" x2="7" y2="7" />
                <line x1="9" y1="9" x2="10.7" y2="10.7" />
                <line x1="10.7" y1="5.3" x2="9" y2="7" />
                <line x1="7" y1="9" x2="5.3" y2="10.7" />
            </g>
        </svg>
    );
}
