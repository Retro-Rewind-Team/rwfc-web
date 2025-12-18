import { Show } from "solid-js";
import type { Track } from "../../types/track";

interface TrackCardProps {
    track: Track;
}

export default function TrackCard(props: TrackCardProps) {
    const getYoutubeThumbnail = (url: string | null | undefined) => {
        if (!url) return null;
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    };

    const thumbnailUrl = () => getYoutubeThumbnail(props.track.youtubeUrl);
    const displayLaps = () => props.track.laps === "-" ? "3" : props.track.laps;

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all overflow-hidden group">
            {/* Thumbnail */}
            <div class="relative bg-gray-100 dark:bg-gray-900">
                <Show
                    when={thumbnailUrl()}
                    fallback={
                        <div class="aspect-video flex items-center justify-center text-gray-400">
                            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                        </div>
                    }
                >
                    <a
                        href={props.track.youtubeUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block aspect-video relative group/thumb"
                    >
                        <img
                            src={thumbnailUrl()!}
                            alt={props.track.name}
                            class="w-full h-full object-cover"
                        />
                        {/* Play overlay */}
                        <div class="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center">
                            <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform group-hover/thumb:scale-110 transition-transform">
                                <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                        </div>
                    </a>
                </Show>
            </div>

            {/* Content */}
            <div class="p-4">
                <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {props.track.name}
                </h3>
                <div class="space-y-1 text-sm mb-3">
                    <p class="text-gray-600 dark:text-gray-400 truncate">
                        <span class="font-medium">Authors:</span> {props.track.authors}
                    </p>
                    <Show when={props.track.laps != null}>
                        <p class="text-gray-600 dark:text-gray-400">
                            <span class="font-medium">Laps:</span> {displayLaps()}
                        </p>
                    </Show>
                </div>

                {/* Footer */}
                <div class="flex items-center justify-between">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {props.track.version}
                    </span>
                    <Show when={props.track.wikiUrl}>
                        <a
                            href={props.track.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm inline-flex items-center"
                            title="View on Wiki"
                        >
                            Wiki
                            <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                        </a>
                    </Show>
                </div>
            </div>
        </div>
    );
}
