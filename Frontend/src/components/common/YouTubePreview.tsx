import { createSignal, Show } from "solid-js";
import { Play } from "lucide-solid";
import { TextLink } from "./Button";

/** Pulls the video id out of a youtube.com/watch?v= or youtu.be/ link. */
export function youtubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
        if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v");
    } catch {
        // Not a URL; fall through.
    }
    return null;
}

interface YouTubePreviewProps {
    url: string;
    /** The video's subject, used for the thumbnail alt text and the player's title. */
    title: string;
}

/*
 * A click-to-load YouTube player ("facade"). Until someone presses play, the page shows only
 * YouTube's own thumbnail for the video: no YouTube scripts, cookies or player weight. On click
 * the thumbnail is swapped for a youtube-nocookie.com embed that starts playing, and focus moves
 * into it so keyboard users land in the player. A plain "Watch on YouTube" link is always there.
 */
export default function YouTubePreview(props: YouTubePreviewProps) {
    const [playing, setPlaying] = createSignal(false);
    const id = () => youtubeId(props.url);
    let frame: HTMLIFrameElement | undefined;

    return (
        <Show when={id()}>
            {(videoId) => (
                <figure>
                    <div class="relative aspect-video overflow-hidden rounded-lg border border-line bg-surface">
                        <Show
                            when={playing()}
                            fallback={
                                <button
                                    type="button"
                                    class="group absolute inset-0 h-full w-full"
                                    onClick={() => {
                                        setPlaying(true);
                                        queueMicrotask(() => frame?.focus());
                                    }}
                                >
                                    <img
                                        src={`https://i.ytimg.com/vi/${videoId()}/hqdefault.jpg`}
                                        width="480"
                                        height="360"
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        class="h-full w-full object-cover"
                                    />
                                    {/* A solid brand-green play badge: visible on any thumbnail, no glow or scrim. */}
                                    <span class="absolute inset-0 flex items-center justify-center">
                                        <span class="flex h-14 w-20 items-center justify-center rounded-lg bg-accent text-accent-fg transition-[background-color,transform] group-hover:scale-105 group-hover:bg-accent-hover">
                                            <Play
                                                size={22}
                                                fill="currentColor"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </span>
                                    <span class="sr-only">Play video: {props.title}</span>
                                </button>
                            }
                        >
                            <iframe
                                ref={(el) => (frame = el)}
                                src={`https://www.youtube-nocookie.com/embed/${videoId()}?autoplay=1&rel=0`}
                                title={`YouTube video: ${props.title}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                class="absolute inset-0 h-full w-full"
                            />
                        </Show>
                    </div>
                    <figcaption class="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span class="text-fg-muted">{props.title}</span>
                        <TextLink href={props.url} newTab class="shrink-0">
                            Watch on YouTube
                        </TextLink>
                    </figcaption>
                </figure>
            )}
        </Show>
    );
}
