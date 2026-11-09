interface LiveRegionProps {
    /** What to announce. Change it when results settle; an empty string announces nothing. */
    message: string;
}

/**
 * A visually hidden status region for results that change without a page load (a filter, a
 * search, a page change). Keep it mounted for the life of the page: screen readers only announce
 * changes to a live region that already exists, so a region created together with its text is
 * often skipped. Callers pass a finished sentence, never a loading state, so one change gives one
 * announcement.
 */
export default function LiveRegion(props: LiveRegionProps) {
    return (
        <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {props.message}
        </div>
    );
}
