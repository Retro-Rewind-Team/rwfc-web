import { createSignal } from "solid-js";

export default function ContactPage() {
    const [isDonationModalOpen, setIsDonationModalOpen] = createSignal(false);

    const donationLinks = [
        {
            name: "ZPL",
            role: "Head of Retro Rewind/Pack Developer",
            url: "https://ko-fi.com/zpl__",
            color: "bg-blue-600 hover:bg-blue-700",
        },
        {
            name: "Renverse",
            role: "Host of Retro WFC Server",
            url: "https://streamlabs.com/renverse64/tip",
            color: "bg-purple-600 hover:bg-purple-700",
        },
        {
            name: "Lami",
            role: "Retro WFC/Bot Developer",
            url: "https://ko-fi.com/lilousky",
            color: "bg-green-600 hover:bg-green-700",
        },
        {
            name: "Ppeb",
            role: "Retro WFC Developer/Status Page/Bot Developer",
            url: "https://ko-fi.com/ppebb",
            color: "bg-orange-600 hover:bg-orange-700",
        },
        {
            name: "Wheelwizard Team",
            role: "Wheelwizard Developers",
            url: "https://ko-fi.com/wheelwizard",
            color: "bg-indigo-600 hover:bg-indigo-700",
        },
    ];

    return (
        <>
            <div class="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact & Community
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-300">
            Connect with the Retro Rewind community and support the project
                    </p>
                </div>

                {/* Community Links */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discord */}
                    <a
                        href="https://discord.gg/gXYxgayGWx"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white p-6 rounded-lg transition-colors group"
                    >
                        <div class="flex items-center space-x-4">
                            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                            </svg>
                            <div>
                                <h3 class="text-xl font-semibold">Join our Discord</h3>
                                <p class="text-indigo-200 group-hover:text-white">
                  Chat with the community, get help, participate in events, and
                  stay updated on development
                                </p>
                            </div>
                        </div>
                    </a>

                    {/* GitHub */}
                    <a
                        href="https://github.com/Retro-Rewind-Team"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white p-6 rounded-lg transition-colors group"
                    >
                        <div class="flex items-center space-x-4">
                            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                            </svg>
                            <div>
                                <h3 class="text-xl font-semibold">GitHub Organization</h3>
                                <p class="text-gray-300 group-hover:text-white">
                  Contribute to Retro Rewind, Wheel Wizard, report bugs, or view
                  the source code
                                </p>
                            </div>
                        </div>
                    </a>
                </div>

                {/* Project Info */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            About Retro Rewind
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Project Details
                            </h3>
                            <ul class="space-y-2 text-gray-600 dark:text-gray-300">
                                <li>
                                    <strong>Creator:</strong> ZPL
                                </li>
                                <li>
                                    <strong>Current Version:</strong> v6.2.3 (July 22, 2025)
                                </li>
                                <li>
                                    <strong>Engine:</strong> Pulsar v2.0.1
                                </li>
                                <li>
                                    <strong>Server:</strong> Retro WFC
                                </li>
                                <li>
                                    <strong>Content:</strong> 184 retro tracks + 80 custom tracks
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Key Features
                            </h3>
                            <ul class="space-y-2 text-gray-600 dark:text-gray-300">
                                <li>• All retro tracks from SMK to MK7</li>
                                <li>• 200cc/500cc modes with brake drifting</li>
                                <li>• Knockout Mode, Item Rain and TTs Online</li>
                                <li>• Custom music by Mayro</li>
                                <li>• Discord Rich Presence (Dolphin)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Support Section */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Support the Project
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contributing */}
                        <div class="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div class="text-4xl mb-4">🤝</div>
                            <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-3">
                Contributing
                            </h3>
                            <p class="text-blue-800 dark:text-blue-400 mb-4">
                Help improve Retro Rewind through code contributions, testing,
                track creation, or translation
                            </p>
                            <div class="space-y-3">
                                <a
                                    href="https://github.com/Retro-Rewind-Team"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="block w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition-colors"
                                >
                  View GitHub Projects
                                </a>
                                <a
                                    href="https://discord.gg/gXYxgayGWx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="block w-full bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400 font-medium py-3 px-4 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                                >
                  Join Discord
                                </a>
                            </div>
                        </div>

                        {/* Community */}
                        <div class="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <div class="text-4xl mb-4">💝</div>
                            <h3 class="text-xl font-semibold text-green-900 dark:text-green-300 mb-3">
                Community Support
                            </h3>
                            <p class="text-green-800 dark:text-green-400 mb-4">
                Support the project by spreading the word, creating content, or
                helping other players
                            </p>
                            <div class="space-y-3">
                                <button
                                    onClick={() => setIsDonationModalOpen(true)}
                                    class="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium py-3 px-4 rounded transition-colors"
                                >
                  Support the Team
                                </button>
                                <a
                                    href="https://wiki.tockdom.com/wiki/Retro_Rewind"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="block w-full bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-green-600 dark:text-green-400 font-medium py-3 px-4 rounded border border-green-300 dark:border-green-600 transition-colors"
                                >
                  Help Update Wiki
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Helpful Resources */}
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
                    <div class="flex items-start space-x-3">
                        <div class="text-2xl">📚</div>
                        <div>
                            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 transition-colors">
                Additional Resources
                            </h3>
                            <p class="text-blue-800 dark:text-blue-200 mb-4 transition-colors">
                Find more help and information through these official channels
                and resources.
                            </p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <a
                                    href="https://wiki.tockdom.com/wiki/Retro_Rewind#Known_Issues_and_Fixes"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-center"
                                >
                  Troubleshooting Guide
                                </a>
                                <a
                                    href="https://github.com/TeamWheelWizard/WheelWizard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded border border-blue-300 dark:border-blue-600 transition-colors text-center"
                                >
                  Wheel Wizard (Dolphin)
                                </a>
                                <a
                                    href="/vr"
                                    class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded border border-blue-300 dark:border-blue-600 transition-colors text-center"
                                >
                  VR Leaderboard
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donation Modal */}
            {isDonationModalOpen() && (
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Support the Retro Rewind Team
                            </h3>
                            <button
                                onClick={() => setIsDonationModalOpen(false)}
                                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                                        stroke-width={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div class="p-6">
                            <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Choose who you'd like to support. Each team member contributes
                to making Retro Rewind amazing!
                            </p>

                            <div class="space-y-4">
                                {donationLinks.map((person) => (
                                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <h4 class="font-semibold text-gray-900 dark:text-white">
                                                {person.name}
                                            </h4>
                                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                                {person.role}
                                            </p>
                                        </div>
                                        <a
                                            href={person.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class={`${person.color} text-white px-4 py-2 rounded font-medium transition-colors`}
                                        >
                      Donate
                                        </a>
                                    </div>
                                ))}
                            </div>

                            <div class="mt-6 text-center">
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                  💝 Every contribution helps keep Retro Rewind running and
                  improving!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
