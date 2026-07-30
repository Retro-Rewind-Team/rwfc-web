import { useQuery } from "@tanstack/solid-query";
import { Show } from "solid-js";
import { ExternalLink } from "lucide-solid";
import { leaderboardApi } from "../../../services/api/leaderboard";
import { queryKeys } from "../../../constants/queryKeys";

interface DistributionCardProps {
    name: string;
    discordUrl: string;
}

export default function DistributionCard(props: DistributionCardProps) {
    const iconQuery = useQuery(() => ({
        queryKey: queryKeys.discordInviteIcon(props.discordUrl),
        queryFn: () => leaderboardApi.getDiscordInviteIcon(props.discordUrl),
        staleTime: 1000 * 60 * 60,
    }));

    return (
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors p-4 text-center">
            <Show when={iconQuery.data}>
                <a
                    href={props.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block mb-3"
                >
                    <img
                        src={iconQuery.data!}
                        alt={`${props.name} Discord server icon`}
                        class="w-16 h-16 rounded-full object-cover mx-auto"
                    />
                </a>
            </Show>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{props.name}</h3>
            <a
                href={props.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm transition-colors"
            >
                Join Discord
                <ExternalLink size={14} />
            </a>
        </div>
    );
}
