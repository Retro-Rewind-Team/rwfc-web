export default function MajorContributorBadge() {
    return (
        <svg viewBox="0 0 16 16" class="w-full h-full drop-shadow-lg">
            <defs>
                <linearGradient id="major-contributor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FDE68A;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#F59E0B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#B45309;stop-opacity:1" />
                </linearGradient>
            </defs>

            <circle
                cx="8"
                cy="8"
                r="7.5"
                fill="url(#major-contributor-grad)"
                stroke="#78350F"
                stroke-width="0.4"
            />
            <circle
                cx="8"
                cy="8"
                r="7.1"
                fill="none"
                stroke="rgba(253, 230, 138, 0.3)"
                stroke-width="0.3"
            />
            <circle cx="8" cy="8" r="6" fill="#92400E" stroke="#78350F" stroke-width="0.3" />
            <path
                d="M 3 3 Q 8 5, 13 3"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="0.5"
            />

            <path
                d="M8 4L9 6.8L12 6.9L9.6 8.8L10.4 11.7L8 9.9L5.6 11.7L6.4 8.8L4 6.9L7 6.8Z"
                fill="#FEF3C7"
                stroke="#78350F"
                stroke-width="0.3"
                class="drop-shadow-md"
            />
        </svg>
    );
}
