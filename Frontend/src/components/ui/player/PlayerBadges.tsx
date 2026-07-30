import { For, Show } from "solid-js";
import Badge from "./Badge";
import { badgeInfo } from "../../../constants/badgeData";

interface PlayerBadgesProps {
    badges: number[] | null | undefined;
    size?: "sm" | "md" | "lg";
    showLabels?: boolean;
}

export default function PlayerBadges(props: PlayerBadgesProps) {
    const badges = () => (props.badges ?? []).filter((id) => id in badgeInfo);

    return (
        <Show when={badges().length > 0}>
            <div class="inline-flex items-center gap-1.5 flex-wrap">
                <For each={badges()}>
                    {(badge) => (
                        <Badge variant={badge} size={props.size} showLabel={props.showLabels} />
                    )}
                </For>
            </div>
        </Show>
    );
}
