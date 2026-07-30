export default function HeartBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="heart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FCA5A5;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#EF4444;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#B91C1C;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#heart-grad)"
                stroke="#7F1D1D"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(252, 165, 165, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#991B1B" stroke="#7F1D1D" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <path
                d="M8 12 C4.5 9.3 3.2 7.3 3.6 5.7 C3.9 4.4 5.6 3.7 7 4.9 C7.5 5.3 7.8 5.8 8 6.2 C8.2 5.8 8.5 5.3 9 4.9 C10.4 3.7 12.1 4.4 12.4 5.7 C12.8 7.3 11.5 9.3 8 12 Z"
                fill="#FECACA"
                stroke="#7F1D1D"
                stroke-width="0.3"
                class="drop-shadow-md"
            />
        </svg>
    );
}
