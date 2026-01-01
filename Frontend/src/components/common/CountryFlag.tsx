import { Show } from "solid-js";

interface CountryFlagProps {
  countryAlpha2: string | null | undefined;
  countryName?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function CountryFlag(props: CountryFlagProps) {
    const sizeClasses = () => {
        switch (props.size) {
        case "sm":
            return "w-4 h-3";
        case "lg":
            return "w-8 h-6";
        default:
            return "w-6 h-4";
        }
    };

    return (
        <Show when={props.countryAlpha2}>
            <span
                class={`fi fi-${props.countryAlpha2?.toLowerCase()} ${sizeClasses()} inline-block rounded shadow-sm`}
                title={props.countryName || props.countryAlpha2?.toUpperCase()}
            />
        </Show>
    );
}