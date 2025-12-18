import { For, Show } from "solid-js";
import Badge from "./Badge";
import { getPlayerBadges } from "../../utils/badgeData";

interface PlayerBadgesProps {
    friendCode: string;
    size?: "sm" | "md" | "lg";
    showLabels?: boolean;
}

export default function PlayerBadges(props: PlayerBadgesProps) {
    const badges = () => getPlayerBadges(props.friendCode);
    const hasBadges = () => badges().length > 0;

    return (
        <Show when={hasBadges()}>
            <div class="inline-flex items-center gap-1.5 flex-wrap">
                <For each={badges()}>
                    {(badge) => (
                        <Badge 
                            variant={badge} 
                            size={props.size} 
                            showLabel={props.showLabels}
                        />
                    )}
                </For>
            </div>
        </Show>
    );
}
