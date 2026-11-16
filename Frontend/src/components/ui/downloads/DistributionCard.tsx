import { useQuery } from "@tanstack/solid-query";
import { Show } from "solid-js";
import { leaderboardApi } from "../../../services/api/leaderboard";
import { queryKeys } from "../../../constants/queryKeys";
import { BrandIcon, Card, TextLink } from "../../common";

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
        <Card class="flex h-full items-center gap-4">
            {/* Fixed-size slot so the card does not shift when the icon arrives. The initial shows
                until then, or for good if Discord does not return an icon. */}
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface text-sm font-semibold text-fg-muted"
                aria-hidden="true"
            >
                <Show when={iconQuery.data} fallback={props.name.charAt(0)}>
                    <img
                        src={iconQuery.data!}
                        alt=""
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                        class="h-10 w-10 object-cover"
                    />
                </Show>
            </div>
            <div class="min-w-0">
                <h3 class="font-medium text-fg">{props.name}</h3>
                <TextLink
                    href={props.discordUrl}
                    newTab
                    class="inline-flex items-center gap-1.5 text-sm"
                    aria-label={`${props.name} Discord server`}
                >
                    <BrandIcon name="discord" size={14} />
                    Discord server
                </TextLink>
            </div>
        </Card>
    );
}
