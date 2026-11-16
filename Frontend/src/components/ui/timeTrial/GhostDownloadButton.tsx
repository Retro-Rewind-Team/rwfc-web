import { Show } from "solid-js";
import { Download } from "lucide-solid";
import Tooltip from "../../common/Tooltip";

interface GhostDownloadButtonProps {
    /** Whether the submission has a ghost file to download. */
    available: boolean;
    /** Unique per button on the page; ties the unavailable reason to the button. */
    submissionId: number;
    onDownload: () => void;
    /** `table` is the compact icon button in a row; `block` is the full-width labelled button. */
    variant?: "table" | "block";
}

const UNAVAILABLE_REASON = "Ghost file not available for this submission";

/**
 * The reason a ghost cannot be downloaded used to live only in `title`, which touch and keyboard
 * users never see. The button now uses `aria-disabled` rather than `disabled` so it stays
 * focusable: focus or a tap shows the reason in a tooltip, and screen readers hear it through
 * `aria-describedby`. The click is ignored while unavailable.
 */
export default function GhostDownloadButton(props: GhostDownloadButtonProps) {
    const isBlock = () => props.variant === "block";
    // The track page shows one submission in both a table row and the record history, so the
    // variant is part of the id.
    const reasonId = () =>
        `ghost-unavailable-${isBlock() ? "block" : "table"}-${props.submissionId}`;

    // A function, so each branch of the Show below gets its own element.
    const button = () => (
        <button
            type="button"
            aria-disabled={!props.available}
            aria-describedby={props.available ? undefined : reasonId()}
            aria-label={isBlock() ? undefined : "Download ghost"}
            onClick={() => {
                if (props.available) props.onDownload();
            }}
            class={`inline-flex items-center border border-transparent text-xs font-medium rounded-md transition-colors ${
                isBlock()
                    ? "justify-center gap-1.5 px-3 py-1.5 w-full sm:w-auto"
                    : "p-2 sm:px-3 sm:py-1.5"
            } ${
                props.available
                    ? "text-accent-fg bg-accent hover:bg-accent-hover"
                    : "text-fg-subtle bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
            }`}
        >
            <Download size={isBlock() ? 14 : 16} class={isBlock() ? undefined : "sm:mr-1"} />
            {isBlock() ? (
                "Download Ghost"
            ) : (
                <span class="hidden sm:inline" aria-hidden="true">
                    Ghost
                </span>
            )}
        </button>
    );

    return (
        <Show when={!props.available} fallback={button()}>
            <Tooltip text={UNAVAILABLE_REASON}>{button()}</Tooltip>
            <span id={reasonId()} class="sr-only">
                {UNAVAILABLE_REASON}
            </span>
        </Show>
    );
}
