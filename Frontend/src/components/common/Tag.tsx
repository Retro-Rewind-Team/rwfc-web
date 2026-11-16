import { JSX } from "solid-js";

interface TagProps {
    tone?: "neutral" | "accent";
    class?: string;
    children: JSX.Element;
}

/**
 * The badge style: a small, quiet label for metadata such as a track's origin console. Use it
 * for information, not decoration; if a tag would not help someone scan, leave it out.
 */
export default function Tag(props: TagProps) {
    const tone = () =>
        props.tone === "accent"
            ? "border-transparent bg-accent-soft text-accent-text"
            : "border-line text-fg-muted";
    return (
        <span
            class={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium tabular-nums ${tone()} ${props.class ?? ""}`}
        >
            {props.children}
        </span>
    );
}
