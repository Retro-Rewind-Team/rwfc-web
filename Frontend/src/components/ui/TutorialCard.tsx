interface TutorialCardProps {
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
}

export default function TutorialCard(props: TutorialCardProps) {
    return (
        <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                <img 
                    src={props.thumbnailUrl} 
                    alt={`${props.title} Thumbnail`}
                    class="w-full h-full object-cover"
                />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {props.title}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {props.description}
            </p>
            <a
                href={props.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
                Watch Tutorial
            </a>
        </div>
    );
}