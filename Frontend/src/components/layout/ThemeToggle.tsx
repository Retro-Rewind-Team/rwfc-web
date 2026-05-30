import { createSignal, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useTheme } from "../../stores/theme";
import { Check, type LucideIcon, Monitor, Moon, Sun } from "lucide-solid";

export default function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = createSignal(false);

    const themes: { value: "light" | "dark" | "system"; label: string; icon: LucideIcon }[] = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

    const getCurrentIcon = (): LucideIcon => {
        const currentTheme = theme();
        if (currentTheme === "system") {
            return resolvedTheme() === "dark" ? Moon : Sun;
        }
        return themes.find((t) => t.value === currentTheme)?.icon ?? Sun;
    };

    return (
        <div class="relative">
            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen())}
                class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                title="Toggle theme"
            >
                <Dynamic component={getCurrentIcon()} size={20} />
            </button>

            {/* Dropdown Menu */}
            <Show when={isOpen()}>
                <div class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div class="py-1">
                        <For each={themes}>
                            {(themeOption) => (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTheme(themeOption.value);
                                        setIsOpen(false);
                                    }}
                                    class={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                                        theme() === themeOption.value
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    <Dynamic component={themeOption.icon} size={14} />
                                    <span>{themeOption.label}</span>
                                    <Show when={theme() === themeOption.value}>
                                        <span class="ml-auto text-blue-600 dark:text-blue-400">
                                            <Check size={14} />
                                        </span>
                                    </Show>
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </Show>

            {/* Click outside to close */}
            <Show when={isOpen()}>
                <button
                    type="button"
                    class="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                    onClick={() => setIsOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
                    aria-label="Close theme menu"
                />
            </Show>
        </div>
    );
}
