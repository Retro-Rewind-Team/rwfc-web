export default function BetaTesterBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="beta-tester-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#67E8F9;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#06B6D4;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0E7490;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#beta-tester-grad)"
                stroke="#164E63"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(103, 232, 249, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#155E75" stroke="#164E63" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g stroke="#A5F3FC" stroke-width="1" fill="none" class="drop-shadow-md">
                <path d="M6.8 4.5 H9.2 M7.2 4.5 V7.6 L4.8 11.3 C4.4 11.9 4.8 12.5 5.5 12.5 H10.5 C11.2 12.5 11.6 11.9 11.2 11.3 L8.8 7.6 V4.5" />
                <line x1="5.8" y1="9.5" x2="10.2" y2="9.5" stroke-width="0.7" />
            </g>
        </svg>
    );
}
