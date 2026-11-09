import { For } from "solid-js";

/*
 * Retro Rewind's nine rank badges, cut from the game's own font (public/ranks). They are the
 * project's authentic in-game art, so the Tools header uses them instead of an illustration.
 * Shown at their native 40 x 39 px so they stay sharp; scaling them up would blur them.
 */
export default function RankGlyphs() {
    return (
        <figure class="rounded-lg border border-line bg-surface p-5">
            {/* One row of nine at native size: 9 x 40px fits every panel width from sm up. */}
            <ul class="grid grid-cols-9 items-center justify-items-center gap-1">
                <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>
                    {(rank) => (
                        <li>
                            <img
                                src={`/ranks/rank-${rank}.png`}
                                alt={`Rank ${rank} badge`}
                                width="40"
                                height="39"
                                loading="eager"
                                decoding="async"
                                class="h-auto w-full max-w-10"
                            />
                        </li>
                    )}
                </For>
            </ul>
            <figcaption class="mt-4 text-sm text-fg-muted">
                The nine Retro Rewind ranks, from the game's own font. The Rank Helper shows what
                you need for the next one.
            </figcaption>
        </figure>
    );
}
