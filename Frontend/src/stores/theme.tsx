import {
    createContext,
    createEffect,
    createSignal,
    onMount,
    useContext,
} from "solid-js";

export type Theme = "light" | "dark" | "system";

const [theme, setTheme] = createSignal<Theme>("system");
const [resolvedTheme, setResolvedTheme] = createSignal<"light" | "dark">(
    "dark"
);

// Theme context
const ThemeContext = createContext<{
  theme: () => Theme;
  resolvedTheme: () => "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
      }>({
          theme,
          resolvedTheme,
          setTheme,
          toggleTheme: () => {},
      });

export function ThemeProvider(props: Readonly<{ children: any }>) {
    const getSystemTheme = (): "light" | "dark" => {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return "dark";
    };

    const forceApplyTheme = (themeToApply: "light" | "dark") => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;
        const body = document.body;

        root.classList.remove("light", "dark");
        body.classList.remove("light", "dark");

        root.style.colorScheme = themeToApply;

        root.classList.add(themeToApply);

        body.classList.add(themeToApply);

        root.setAttribute("data-theme", themeToApply);
        root.setAttribute("data-mode", themeToApply);
        body.setAttribute("data-theme", themeToApply);

        root.style.setProperty("--theme", themeToApply);

        // root.offsetHeight;

        const metaThemeColor = document.querySelector("meta[name=\"theme-color\"]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                "content",
                themeToApply === "dark" ? "#0f172a" : "#ffffff"
            );
        }
    };

    const updateResolvedTheme = () => {
        const currentTheme = theme();
        let newResolvedTheme: "light" | "dark";

        if (currentTheme === "system") {
            newResolvedTheme = getSystemTheme();
        } else {
            newResolvedTheme = currentTheme;
        }

        setResolvedTheme(newResolvedTheme);
    };

    const initializeTheme = () => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("retro-rewind-theme") as Theme;

                if (stored && ["light", "dark", "system"].includes(stored)) {
                    setTheme(stored);
                } else {
                    setTheme("system");
                }
            } catch (error) {
                console.error("❌ Error reading from localStorage:", error);
                setTheme("system");
            }
        }
    };

    const saveTheme = (newTheme: Theme) => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("retro-rewind-theme", newTheme);
            } catch (error) {
                console.error("❌ Error saving to localStorage:", error);
            }
        }
    };

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        saveTheme(newTheme);
    };

    const toggleTheme = () => {
        const current = resolvedTheme();
        const newTheme = current === "dark" ? "light" : "dark";
        handleSetTheme(newTheme);
    };

    onMount(() => {
        const systemTheme = getSystemTheme();
        forceApplyTheme(systemTheme);

        // Then initialize from storage
        initializeTheme();

        if (typeof window !== "undefined") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

            const handleSystemThemeChange = () => {
                if (theme() === "system") {
                    updateResolvedTheme();
                }
            };

            mediaQuery.addEventListener("change", handleSystemThemeChange);

            return () => {
                mediaQuery.removeEventListener("change", handleSystemThemeChange);
            };
        }
    });

    createEffect(() => {
        const current = resolvedTheme();
        forceApplyTheme(current);
    });

    createEffect(() => {
        updateResolvedTheme();
    });

    const contextValue = {
        theme,
        resolvedTheme,
        setTheme: handleSetTheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {props.children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
