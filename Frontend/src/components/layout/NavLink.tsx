import { A } from "@solidjs/router";
import { JSX } from "solid-js";

interface NavLinkProps {
    href: string;
    end?: boolean;
    /** "bar" for the desktop header, "list" for the stacked mobile menu. */
    layout?: "bar" | "list";
    onClick?: () => void;
    children: JSX.Element;
}

/*
 * The router marks a link active for its whole subtree (/vr stays active on /vr/player/...), and
 * sets aria-current="page" itself on exact matches. Active and inactive colours are separate
 * classes so they never fight over specificity.
 */
export default function NavLink(props: NavLinkProps) {
    const layoutClass = () =>
        props.layout === "list"
            ? "flex h-11 items-center px-3 text-base"
            : "inline-flex h-9 items-center px-3 text-sm";

    return (
        <A
            href={props.href}
            end={props.end}
            onClick={() => props.onClick?.()}
            class={`${layoutClass()} rounded-md font-medium transition-colors duration-150 hover:bg-surface hover:text-fg`}
            activeClass="bg-surface text-fg"
            inactiveClass="text-fg-muted"
        >
            {props.children}
        </A>
    );
}
