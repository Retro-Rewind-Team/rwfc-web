import { JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

interface CardProps extends JSX.HTMLAttributes<HTMLElement> {
    /** Element to render. Use "section" or "article" when the card is a landmark or self-contained. */
    as?: "div" | "section" | "article" | "aside";
    /** "none" for cards whose children manage their own padding, such as lists and tables. */
    padding?: "none" | "md";
}

/** The one bordered panel style. Borders, not shadows, separate it from the page. */
export default function Card(props: CardProps) {
    const [local, rest] = splitProps(props, ["as", "padding", "class", "children"]);
    return (
        <Dynamic
            component={local.as ?? "div"}
            class={`rounded-lg border border-line bg-canvas ${
                local.padding === "none" ? "" : "p-5 sm:p-6"
            } ${local.class ?? ""}`}
            {...rest}
        >
            {local.children}
        </Dynamic>
    );
}
