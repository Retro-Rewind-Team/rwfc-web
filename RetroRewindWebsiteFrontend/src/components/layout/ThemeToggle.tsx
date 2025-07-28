import { createSignal, Show } from "solid-js";
import { useTheme } from "../../stores/theme";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = createSignal(false);

  const themes = [
    { value: "light" as const, label: "Light", icon: "☀️" },
    { value: "dark" as const, label: "Dark", icon: "🌙" },
    { value: "system" as const, label: "System", icon: "💻" },
  ];

  const getCurrentIcon = () => {
    const currentTheme = theme();
    if (currentTheme === "system") {
      return resolvedTheme() === "dark" ? "🌙" : "☀️";
    }
    return themes.find((t) => t.value === currentTheme)?.icon || "☀️";
  };

  return (
    <div class="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        title="Toggle theme"
      >
        <span class="text-xl">{getCurrentIcon()}</span>
      </button>

      {/* Dropdown Menu */}
      <Show when={isOpen()}>
        <div class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div class="py-1">
            {themes.map((themeOption) => (
              <button
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
                class={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                  theme() === themeOption.value
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>{themeOption.icon}</span>
                <span>{themeOption.label}</span>
                {theme() === themeOption.value && (
                  <span class="ml-auto text-blue-600 dark:text-blue-400">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Show>

      {/* Click outside to close */}
      <Show when={isOpen()}>
        <button
          class="fixed inset-0 z-40 bg-transparent border-none cursor-default"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
          aria-label="Close theme menu"
        />
      </Show>
    </div>
  );
}
