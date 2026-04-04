import { ExternalLink, Play } from "lucide-solid";

interface TutorialCardProps {
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
}

export default function TutorialCard(props: TutorialCardProps) {
    return (
        <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <a
                href={props.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="block relative group"
            >
                <div class="h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                        src={props.thumbnailUrl}
                        alt={`${props.title} thumbnail`}
                        class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                </div>
                <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div class="bg-white/90 dark:bg-gray-900/90 rounded-full p-3 shadow-lg">
                        <Play size={20} class="text-gray-900 dark:text-white" />
                    </div>
                </div>
            </a>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">{props.title}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">{props.description}</p>
                <a
                    href={props.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                    Watch Tutorial
                    <ExternalLink size={14} />
                </a>
            </div>
        </div>
    );
}
