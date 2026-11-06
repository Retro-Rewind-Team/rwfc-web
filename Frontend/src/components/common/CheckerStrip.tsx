interface CheckerStripProps {
    /** Unique per page: SVG pattern ids are global to the document. */
    id: string;
    class?: string;
}

/**
 * A two-row checkered start line, used to close the dark header bands. The home hero draws the
 * same strip inline (it is left untouched on purpose); new code should use this component.
 * Decorative, so hidden from assistive technology.
 */
export default function CheckerStrip(props: CheckerStripProps) {
    return (
        <svg class={`block h-4 w-full text-line ${props.class ?? ""}`} aria-hidden="true">
            <defs>
                <pattern
                    id={`checker-${props.id}`}
                    width="16"
                    height="16"
                    patternUnits="userSpaceOnUse"
                >
                    <rect width="8" height="8" fill="currentColor" />
                    <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#checker-${props.id})`} />
        </svg>
    );
}
