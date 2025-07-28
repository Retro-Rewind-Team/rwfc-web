import { Show, onMount } from "solid-js";
import { useMiiImage, useIntersectionObserver } from "../../hooks/useMiiLoader";

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

  const getGradientColors = () => {
    const hash = props.friendCode.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const gradients = [
      "from-blue-500 to-purple-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-blue-600",
      "from-yellow-500 to-red-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
    ];

    return gradients[Math.abs(hash) % gradients.length];
  };

  const getSpinnerSize = () => {
    const currentSize = size();
    if (currentSize === "sm") return "w-3 h-3";
    if (currentSize === "md") return "w-4 h-4";
    return "w-5 h-5";
  };

  const LoadingSpinner = () => (
    <div
      class={`w-full h-full bg-gradient-to-br ${getGradientColors()} flex items-center justify-center`}
    >
      <div
        class={`animate-spin rounded-full border-2 border-white border-t-transparent ${getSpinnerSize()}`}
      ></div>
    </div>
  );

  const FallbackAvatar = () => (
    <div
      class={`w-full h-full bg-gradient-to-br ${getGradientColors()} flex items-center justify-center`}
    >
      <span class="text-white font-bold select-none drop-shadow-sm">
        {getInitials()}
      </span>
    </div>
  );

  const currentMiiImage = () => miiImage();

  return (
    <div
      ref={containerRef}
      class={`relative inline-flex items-center justify-center ${sizeClasses[size()]} rounded-full overflow-hidden shadow-sm ${props.className || ""}`}
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
