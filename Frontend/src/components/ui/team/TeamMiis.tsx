import { For } from "solid-js";
import { teamData } from "../../../constants/teamData";

/*
 * Hand-picked, Miis only. Many profile pictures on the team page are personal photos or
 * third-party characters, which are fine beside a name in the list but not as the page's banner.
 * If a member changes their picture to something that is not a Mii, swap them out here.
 */
const HEADER_MIIS = [
    "/profiles/ZPL.png",
    "/profiles/jacher.png",
    "/profiles/Patchzy.png",
    "/profiles/Gab.png",
    "/profiles/Mel.png",
    "/profiles/WTBM.png",
    "/profiles/matty.png",
    "/profiles/Zeraora.png",
];

/*
 * The Team page header visual: eight of the team's own Miis. These portraits already appear on
 * the page, so nothing new is published. Decorative here, because every member is listed with
 * their name just below.
 */
export default function TeamMiis() {
    // Only portraits that still belong to a listed member, so a departure never leaves a stray.
    const listed = new Set(
        Object.values(teamData).flatMap((members) => members.map((m) => m.image)),
    );
    const members = HEADER_MIIS.filter((src) => listed.has(src)).map((image) => ({ image }));

    return (
        <ul class="grid grid-cols-4 gap-3" aria-hidden="true">
            <For each={members}>
                {(member) => (
                    <li class="aspect-square overflow-hidden rounded-lg border border-line bg-surface">
                        <img
                            src={member.image}
                            alt=""
                            width="270"
                            height="270"
                            loading="eager"
                            decoding="async"
                            class="h-full w-full object-cover"
                        />
                    </li>
                )}
            </For>
        </ul>
    );
}
