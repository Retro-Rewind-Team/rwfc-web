import { Dynamic } from "solid-js/web";
import { Monitor, Moon, Sun } from "lucide-solid";
import { useTheme } from "../../stores/theme";

const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
] as const;

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const index = () => themes.findIndex((option) => option.value === theme());
    const current = () => themes[index()];
    const next = () => themes[(index() + 1) % themes.length];
    return (
        <button
            type="button"
            class="theme-cycle"
            aria-label={`Theme: ${current().label}. Switch to ${next().label} mode`}
            title="Cycle Light → Dark → System"
            onClick={() => setTheme(next().value)}
        >
            <Dynamic component={current().icon} size={16} aria-hidden="true" />
            <span>{current().label}</span>
        </button>
    );
}
