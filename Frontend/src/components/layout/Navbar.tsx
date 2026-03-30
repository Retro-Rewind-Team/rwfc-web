import { A } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Menu, X } from "lucide-solid";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
    { href: "/", label: "Home", end: true },
    { href: "/vr", label: "VR Leaderboard" },
    { href: "/tt", label: "TT Leaderboard" },
    { href: "/rooms", label: "Rooms" },
    { href: "/downloads", label: "Downloads" },
    { href: "/team", label: "Team" },
    { href: "/rules", label: "Rules" },
    { href: "/privacy", label: "Privacy" },
    { href: "/stats", label: "Stats" },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);

    return (
        <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center h-16">
                    {/* Logo */}
                    <A href="/">
                        <img
                            src="/RetroRewindLogo.png"
                            alt="Retro Rewind"
                            class="w-42 h-22 object-contain"
                        />
                    </A>

                    {/* Desktop Navigation */}
                    <div class="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <A
                                href={link.href}
                                end={link.end}
                                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            >
                                {link.label}
                            </A>
                        ))}
                        <ThemeToggle />
                    </div>

                    {/* Mobile: theme toggle + hamburger */}
                    <div class="md:hidden flex items-center space-x-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(o => !o)}
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={isMenuOpen() ? "Close menu" : "Open menu"}
                        >
                            {isMenuOpen() ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen() && (
                    <div class="md:hidden pb-6">
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg mt-3 p-3 space-y-1 shadow-lg border border-gray-200 dark:border-gray-600">
                            {navLinks.map((link) => (
                                <A
                                    href={link.href}
                                    end={link.end}
                                    class="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                                    activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </A>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
