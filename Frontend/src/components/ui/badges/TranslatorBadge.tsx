export default function TranslatorBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="trans-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#C4B5FD;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#6D28D9;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle cx="8" cy="8" r="7.5" fill="url(#trans-grad)" stroke="#4C1D95" stroke-width="0.4" />
            <circle cx="8" cy="8" r="7.1" fill="none" stroke="rgba(196, 181, 253, 0.3)" stroke-width="0.3" />
            <circle cx="8" cy="8" r="6" fill="#5B21B6" stroke="#4C1D95" stroke-width="0.3" />
            <path d="M 3 3 Q 8 5, 13 3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />

            <g stroke="#DDD6FE" stroke-width="1" fill="none" class="drop-shadow-md">
                <circle cx="8" cy="8" r="3.5" />
                <ellipse cx="8" cy="8" rx="1.5" ry="3.5" />
                <line x1="4.5" y1="8" x2="11.5" y2="8" />
                <path d="M5.5 5.5 Q8 6 10.5 5.5" />
                <path d="M5.5 10.5 Q8 10 10.5 10.5" />
            </g>
        </svg>
    );
}
