import { createSignal, For, onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Check, type LucideIcon, Monitor, Moon, Sun } from "lucide-solid";
import { type Theme, useTheme } from "../../stores/theme";

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
];

/*
 * A small menu rather than a two-state toggle, because "follow my system" is a real third choice.
 * Keyboard: Enter/Space opens, arrow keys move, Escape closes and returns focus to the button.
 */
export default function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = createSignal(false);
    let root: HTMLDivElement | undefined;
    let trigger: HTMLButtonElement | undefined;
    const items: HTMLButtonElement[] = [];

    const currentIcon = () => (resolvedTheme() === "dark" ? Moon : Sun);

    const open = () => {
        setIsOpen(true);
        const index = OPTIONS.findIndex((o) => o.value === theme());
        queueMicrotask(() => items[Math.max(index, 0)]?.focus());
    };

    const close = (returnFocus = true) => {
        setIsOpen(false);
        if (returnFocus) trigger?.focus();
    };

    const onDocumentClick = (e: MouseEvent) => {
        if (isOpen() && root && !root.contains(e.target as Node)) close(false);
    };
    document.addEventListener("click", onDocumentClick);
    onCleanup(() => document.removeEventListener("click", onDocumentClick));

    const onMenuKeyDown = (e: KeyboardEvent) => {
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "Escape") {
            e.preventDefault();
            close();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            items[(index + 1) % items.length]?.focus();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            items[(index - 1 + items.length) % items.length]?.focus();
        } else if (e.key === "Tab") {
            close(false);
        }
    };

    return (
        <div ref={(el) => (root = el)} class="relative">
            <button
                ref={(el) => (trigger = el)}
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                aria-haspopup="menu"
                aria-expanded={isOpen()}
                aria-controls="theme-menu"
                onClick={() => (isOpen() ? close() : open())}
            >
                <span class="sr-only">Theme</span>
                <Dynamic component={currentIcon()} size={18} aria-hidden="true" />
            </button>

            <Show when={isOpen()}>
                <div
                    id="theme-menu"
                    role="menu"
                    aria-label="Theme"
                    class="absolute right-0 z-50 mt-2 w-36 rounded-lg border border-line bg-canvas p-1"
                    onKeyDown={onMenuKeyDown}
                >
                    <For each={OPTIONS}>
                        {(option, i) => (
                            <button
                                ref={(el) => (items[i()] = el)}
                                type="button"
                                role="menuitemradio"
                                aria-checked={theme() === option.value}
                                class="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                                onClick={() => {
                                    setTheme(option.value);
                                    close();
                                }}
                            >
                                <Dynamic component={option.icon} size={15} aria-hidden="true" />
                                <span class="flex-1">{option.label}</span>
                                <Show when={theme() === option.value}>
                                    <Check size={15} class="text-accent-text" aria-hidden="true" />
                                </Show>
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
