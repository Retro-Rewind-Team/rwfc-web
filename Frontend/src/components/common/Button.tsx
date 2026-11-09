import { A } from "@solidjs/router";
import { JSX, Show, splitProps } from "solid-js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
    // A 1px press on click: feedback without movement anyone would notice while reading.
    "transition-[background-color,border-color,color,transform] active:translate-y-px " +
    "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
    // Primary is the one action a view wants people to take. Keep it to one per view.
    primary: "bg-accent text-accent-fg hover:bg-accent-hover",
    secondary: "border border-line-strong bg-canvas text-fg hover:bg-surface",
    ghost: "text-fg-muted hover:bg-surface hover:text-fg",
};

const SIZES: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
    // Square, no padding: overriding md padding with px-0 loses to px-4 on stylesheet order.
    icon: "h-10 w-10",
};

/** Class string for anything that must look like a button but is not rendered by these helpers. */
export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
    return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

export default function Button(props: ButtonProps) {
    const [local, rest] = splitProps(props, ["variant", "size", "class", "type", "children"]);
    return (
        <button
            type={local.type ?? "button"}
            class={`${buttonClass(local.variant, local.size)} ${local.class ?? ""}`}
            {...rest}
        >
            {local.children}
        </button>
    );
}

interface LinkBaseProps {
    href: string;
    /** Opens in a new tab. Adds a hidden "opens in a new tab" note for screen reader users. */
    newTab?: boolean;
    class?: string;
    children: JSX.Element;
    "aria-label"?: string;
}

/*
 * Internal routes go through the router's <A> so navigation stays client-side. Everything else
 * (external sites, file downloads, in-page anchors) is a plain <a>.
 */
function SmartLink(props: LinkBaseProps & { classes: string }) {
    const isRoute = () => props.href.startsWith("/") && !props.newTab;
    // An aria-label replaces the link text for screen readers, hidden note included, so the
    // new-tab warning has to be repeated inside the label itself.
    const label = () =>
        props["aria-label"] && props.newTab
            ? `${props["aria-label"]} (opens in a new tab)`
            : props["aria-label"];
    return (
        <Show
            when={isRoute()}
            fallback={
                <a
                    href={props.href}
                    class={props.classes}
                    target={props.newTab ? "_blank" : undefined}
                    rel={props.newTab ? "noopener noreferrer" : undefined}
                    aria-label={label()}
                >
                    {props.children}
                    <Show when={props.newTab}>
                        <span class="sr-only"> (opens in a new tab)</span>
                    </Show>
                </a>
            }
        >
            <A href={props.href} class={props.classes} aria-label={props["aria-label"]}>
                {props.children}
            </A>
        </Show>
    );
}

export function ButtonLink(props: LinkBaseProps & { variant?: ButtonVariant; size?: ButtonSize }) {
    return (
        <SmartLink
            {...props}
            classes={`${buttonClass(props.variant, props.size)} ${props.class ?? ""}`}
        />
    );
}

/** The one inline link style: accent text, underline on hover. */
export const TEXT_LINK_CLASS =
    "font-medium text-accent-text underline-offset-4 decoration-1 hover:underline";

export function TextLink(props: LinkBaseProps) {
    return <SmartLink {...props} classes={`${TEXT_LINK_CLASS} ${props.class ?? ""}`} />;
}
