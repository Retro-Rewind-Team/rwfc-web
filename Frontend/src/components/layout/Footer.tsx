import { A } from "@solidjs/router";

export default function Footer() {
    return (
        <footer class="bg-gray-800 dark:bg-gray-950 text-white mt-16 transition-colors">
            <div class="container mx-auto px-4 py-12">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div class="md:col-span-1">
                        <div class="flex items-center space-x-2 mb-4">
                            <span class="text-xl font-bold">Retro Rewind</span>
                        </div>
                        <p class="text-gray-300 dark:text-gray-400 text-sm mb-4">
                            Experience every retro track from Super Mario Kart to Mario Kart
                            7, plus tracks from Mario Kart 8, Tour, Arcade GP and Mario Kart World.
                        </p>
                        <div class="flex space-x-4">
                            <a
                                href="https://discord.gg/retrorewind"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                title="Join our Discord"
                            >
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                                </svg>
                            </a>
                            <a
                                href="https://github.com/Retro-Rewind-Team/rwfc-web"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                title="GitHub Repository"
                            >
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Navigation</h3>
                        <ul class="space-y-2">
                            <li>
                                <A
                                    href="/"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    Home
                                </A>
                            </li>
                            <li>
                                <A
                                    href="/vr"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    VR Leaderboard
                                </A>
                            </li>
                            <li>
                                <A
                                    href="/tt"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    TT Leaderboard
                                </A>
                            </li>
                            <li>
                                <A
                                    href="/rooms"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    Room Browser
                                </A>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Resources</h3>
                        <ul class="space-y-2">
                            <li>
                                <A
                                    href="/downloads"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    Downloads
                                </A>
                            </li>
                            <li></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Support</h3>
                        <ul class="space-y-2">
                            <li>
                                <a
                                    href="https://discord.gg/retrorewind"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                                >
                                    Discord Server
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div class="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <div class="text-gray-300 dark:text-gray-400 text-sm mb-4 md:mb-0">
                            © 2026 Retro Rewind Team. This project is not affiliated with
                            Nintendo.
                        </div>
                        <div class="flex space-x-6 text-sm">
                            <a
                                href="/rules"
                                class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
                            >
                                Community Guidelines
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
