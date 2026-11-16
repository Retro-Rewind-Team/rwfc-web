import { onMount, Show } from "solid-js";
import { useIntersectionObserver, useMiiImage } from "../../../hooks/useMiiLoader";

interface MiiComponentProps {
    miiImageBase64?: string;
    playerName: string;
    friendCode: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    showFallback?: boolean;
    lazy?: boolean;
}

export default function MiiComponent(props: Readonly<MiiComponentProps>) {
    let containerRef: HTMLDivElement | undefined;

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-base",
    };

    const size = () => props.size || "md";
    const showFallback = () => props.showFallback !== false;
    const lazy = () => props.lazy !== false;

    const shouldLoadProgressively = () => !props.miiImageBase64;
    const { miiImage, isLoading, loadMii } = shouldLoadProgressively()
        ? useMiiImage(props.friendCode)
        : {
              miiImage: () => props.miiImageBase64,
              isLoading: () => false,
              loadMii: () => {},
          };

    const observeElement = useIntersectionObserver(() => {
        if (shouldLoadProgressively() && !miiImage() && !isLoading()) {
            loadMii();
        }
    });

    onMount(() => {
        if (containerRef && lazy()) {
            observeElement(containerRef);
        } else if (!lazy() && shouldLoadProgressively()) {
            loadMii();
        }
    });

    const getInitials = () => {
        return props.playerName
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const getSpinnerSize = () => {
        const currentSize = size();
        if (currentSize === "sm") return "w-3 h-3";
        if (currentSize === "md") return "w-4 h-4";
        return "w-5 h-5";
    };

    const LoadingSpinner = () => (
        <div class={`w-full h-full bg-surface flex items-center justify-center`}>
            <div
                class={`animate-spin rounded-full border border-fg-subtle border-t-transparent ${getSpinnerSize()}`}
            ></div>
        </div>
    );

    const FallbackAvatar = () => (
        <div class={`w-full h-full bg-surface flex items-center justify-center`}>
            {/* A neutral tile: the initials identify the player without decorative colour. */}
            <span class="text-fg-muted font-semibold select-none">{getInitials()}</span>
        </div>
    );

    const currentMiiImage = () => miiImage();

    return (
        <div
            ref={(el) => (containerRef = el)}
            class={`relative inline-flex items-center justify-center ${sizeClasses[size()]} rounded-full overflow-hidden ${props.className || ""}`}
        >
            <Show
                when={currentMiiImage()}
                fallback={
                    <Show
                        when={isLoading()}
                        fallback={
                            <Show when={showFallback()}>
                                <FallbackAvatar />
                            </Show>
                        }
                    >
                        <LoadingSpinner />
                    </Show>
                }
            >
                <img
                    src={`data:image/png;base64,${currentMiiImage()}`}
                    alt={`${props.playerName}'s Mii`}
                    class="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                    onError={() => {
                        console.warn(`Failed to display Mii image for ${props.friendCode}`);
                    }}
                />
            </Show>
        </div>
    );
}
