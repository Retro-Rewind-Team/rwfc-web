import { For, Show } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { TextLink } from "../../common";
import VerifyMark from "../../common/VerifyMark";
import { FAQ_ITEMS } from "../../../constants/faq";
import { reveal } from "../../../utils/motion";

/*
 * Native <details>/<summary>: keyboard and screen reader support for free, works without
 * JavaScript, and find-in-page can open a closed answer in browsers that support it.
 */
export default function Faq() {
    return (
        <div class="max-w-3xl border-t border-line">
            <For each={FAQ_ITEMS}>
                {(item, i) => (
                    <details class="group border-b border-line" {...reveal(i())}>
                        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-fg transition-colors hover:text-accent-text [&::-webkit-details-marker]:hidden">
                            <h3>{item.question}</h3>
                            <ChevronDown
                                size={18}
                                aria-hidden="true"
                                class="shrink-0 text-fg-subtle transition-transform duration-(--motion-base) group-open:rotate-180"
                            />
                        </summary>
                        <div class="accordion-body pb-5 text-base text-fg-muted">
                            <p>
                                {item.answer}
                                <Show when={item.verify}>
                                    <VerifyMark />
                                </Show>
                            </p>
                            <Show when={item.link}>
                                {(link) => (
                                    <TextLink
                                        href={link().href}
                                        newTab={link().newTab}
                                        class="mt-2 inline-block text-sm"
                                    >
                                        {link().label}
                                    </TextLink>
                                )}
                            </Show>
                        </div>
                    </details>
                )}
            </For>
        </div>
    );
}
