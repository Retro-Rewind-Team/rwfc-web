export default function DiscordStaffBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="discord-staff-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#A5B4FC;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#6366F1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4338CA;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#discord-staff-grad)"
                stroke="#312E81"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(165, 180, 252, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#3730A3" stroke="#312E81" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <g stroke="#C7D2FE" stroke-width="1" fill="none" class="drop-shadow-md">
                <path d="M4.5 5.5 H11.5 C12.05 5.5 12.5 5.95 12.5 6.5 V9.3 C12.5 9.85 12.05 10.3 11.5 10.3 H8.3 L6.3 12 V10.3 H4.5 C3.95 10.3 3.5 9.85 3.5 9.3 V6.5 C3.5 5.95 3.95 5.5 4.5 5.5 Z" />
                <line x1="5.5" y1="7.4" x2="10.5" y2="7.4" stroke-width="0.7" />
                <line x1="5.5" y1="8.6" x2="9" y2="8.6" stroke-width="0.7" />
            </g>
        </svg>
    );
}
