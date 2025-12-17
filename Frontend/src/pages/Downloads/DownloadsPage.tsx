import { downloadsApi } from "../../services/api/download";

export default function DownloadsPage() {
    return (
        <div class="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center">
                <div class="py-4">
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Downloads & Tutorials
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Get everything you need to start racing on Retro Rewind
                    </p>
                </div>
            </div>

            {/* Main Download */}
            <div class="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg p-6">
                <div class="flex items-start space-x-3">
                    <div class="text-2xl">📦</div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                            Retro Rewind v6.5
                        </h2>
                        <p class="text-lg text-blue-800 dark:text-blue-200 mb-4">
                            Complete distribution with 184 retro tracks and 80 custom tracks
                        </p>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <a
                                href={downloadsApi.getFullDownloadUrl()}
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                            >
                                Full Download (First Install)
                            </a>
                            <a
                                href={downloadsApi.getUpdateDownloadUrl()}
                                class="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                            >
                                Update Only (v6.4.2 → v6.5)
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Notes */}
            <div class="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500 rounded-r-lg p-6">
                <div class="flex items-start space-x-3">
                    <div class="text-2xl">⚠️</div>
                    <div>
                        <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                            Important Notes
                        </h3>
                        <div class="text-yellow-800 dark:text-yellow-200 space-y-2">
                            <p>
                                <strong>Do NOT use Wiimmfi-patched games</strong> - Retro Rewind
                                uses Retro WFC servers
                            </p>
                            <p>
                                <strong>Disable all cheat codes</strong> - Any active cheats
                                will prevent online play
                            </p>
                            <p>
                                <strong>Console users:</strong> Extract to SD card root, use
                                Riivolution with "Pack" and "Separate Savegame" enabled
                            </p>
                            <p>
                                <strong>Dolphin users:</strong> Use Wheel Wizard for easiest
                                setup, disable "Enable Cheats"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Tutorials */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Video Tutorials
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                            <img 
                                src="https://img.youtube.com/vi/qH4ou21r8ic/maxresdefault.jpg" 
                                alt="Wii Setup Tutorial Thumbnail"
                                class="w-full h-full object-cover"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            (v)Wii Setup Guide
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            Complete setup walkthrough for Wii and vWii consoles
                        </p>
                        <a
                            href="https://youtu.be/qH4ou21r8ic?si=m7OMOFRn95-ZtVzo"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            Watch Tutorial
                        </a>
                    </div>

                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                            <img 
                                src="https://img.youtube.com/vi/BfuSe-_GpKk/maxresdefault.jpg" 
                                alt="Dolphin Setup Tutorial Thumbnail"
                                class="w-full h-full object-cover"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Dolphin Emulator Guide
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            Step-by-step video guide for installing Retro Rewind on Dolphin
                        </p>
                        <a
                            href="https://www.youtube.com/watch?v=BfuSe-_GpKk"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            Watch Tutorial
                        </a>
                    </div>

                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                            <img 
                                src="https://img.youtube.com/vi/21afHo3ji14/maxresdefault.jpg" 
                                alt="Android Setup Tutorial Thumbnail"
                                class="w-full h-full object-cover"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Android Setup Guide
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            Learn how to install and play Retro Rewind on Android devices
                        </p>
                        <a
                            href="https://www.youtube.com/watch?v=21afHo3ji14"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            Watch Tutorial
                        </a>
                    </div>

                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                            <img 
                                src="https://img.youtube.com/vi/z5PW9iPkZfQ/maxresdefault.jpg" 
                                alt="ISO Builder Tutorial Thumbnail"
                                class="w-full h-full object-cover"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            ISO Builder Tutorial
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            Guide for creating custom Retro Rewind ISOs using ISO Builder
                        </p>
                        <a
                            href="https://www.youtube.com/watch?v=z5PW9iPkZfQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            Watch Tutorial
                        </a>
                    </div>
                </div>
            </div>

            {/* Additional Resources */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                    <div class="text-3xl mb-3">📋</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Track List
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        View all 184 retro tracks, 40 Battle Arenas and 80 custom tracks
                        included in v6.2.3
                    </p>
                    <a
                        href="https://docs.google.com/spreadsheets/d/1FelOidNHL1bqSaKeycZux1eQcDyrosONFC_qWVTYoog/edit?gid=0#gid=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                    >
                        View Track List
                        <svg
                            class="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </a>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                    <div class="text-3xl mb-3">🏆</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Time Trial Records
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        Check out the fastest times and staff ghosts for every track
                    </p>
                    <a
                        href="https://docs.google.com/spreadsheets/d/1XkHTTuUR3_10-C7geVhJ9TtCb4Bz_gE19NysbGnUOZs/edit?gid=0#gid=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                    >
                        View Records
                        <svg
                            class="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </a>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-colors">
                    <div class="text-3xl mb-3">📖</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Full Documentation
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        Complete wiki with features, troubleshooting, and version history
                    </p>
                    <a
                        href="https://wiki.tockdom.com/wiki/Retro_Rewind"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                    >
                        View Wiki
                        <svg
                            class="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Help Section */}
            <div class="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg p-6">
                <div class="flex items-start space-x-3">
                    <div class="text-2xl">ℹ️</div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Need Help?
                        </h3>
                        <p class="text-blue-800 dark:text-blue-200 mb-3">
                            Having trouble with installation or experiencing issues? The Retro
                            Rewind community is very active and helpful! Join our Discord
                            server for real-time support, or check the comprehensive wiki for
                            detailed documentation.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <a
                                href="https://discord.gg/retrorewind"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
                            >
                                <svg
                                    class="w-5 h-5 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                                </svg>
                                Join Discord
                            </a>
                            <a
                                href="https://wiki.tockdom.com/wiki/Retro_Rewind"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded-md border-2 border-blue-300 dark:border-blue-600 transition-colors"
                            >
                                View Wiki
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}