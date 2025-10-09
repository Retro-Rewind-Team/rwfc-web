import { A } from "@solidjs/router";
import { createSignal } from "solid-js";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen());
    };

    return (
        <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div class="flex items-center space-x-3">
                        <A
                            href="/"
                            class="text-xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <img
                                src="/RetroRewindLogo.png"
                                alt="Retro Rewind Logo"
                                class="w-42 h-22 object-contain"
                            />
                        </A>
                    </div>

                    {/* Desktop Navigation */}
                    <div class="hidden md:flex items-center space-x-8">
                        <A
                            href="/"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            end
                        >
              Home
                        </A>
                        <A
                            href="/vr"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        >
              VR Leaderboard
                        </A>
                        <A
                            href="/tt"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        >
              TT Leaderboard
                        </A>
                        <A
                            href="/rooms"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        >
              Rooms
                        </A>
                        <A
                            href="/downloads"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        >
              Downloads
                        </A>
                        <A
                            href="/contact"
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            activeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        >
              Contact
                        </A>

                        {/* Theme Toggle for Desktop */}
                        <ThemeToggle />
                    </div>

                    {/* Mobile menu button and theme toggle */}
                    <div class="md:hidden flex items-center space-x-2">
                        {/* Theme Toggle for Mobile */}
                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={toggleMenu}
                            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div class={isMenuOpen() ? "block md:hidden pb-6" : "hidden"}>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg mt-3 p-3 space-y-2 shadow-lg border border-gray-200 dark:border-gray-600 max-h-screen overflow-y-auto">
                        <A
                            href="/"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>Home</span>
                        </A>
                        <A
                            href="/vr"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>VR Leaderboard</span>
                        </A>
                        <A
                            href="/tt"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>TT Leaderboard</span>
                        </A>
                        <A
                            href="/rooms"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>Room Browser</span>
                        </A>
                        <A
                            href="/downloads"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>Downloads</span>
                        </A>
                        <A
                            href="/contact"
                            class="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
                            activeClass="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600"
                            onClick={() => setIsMenuOpen(false)}
                            end
                        >
                            <span>Contact</span>
                        </A>
                    </div>
                </div>
            </div>
        </nav>
    );
}
