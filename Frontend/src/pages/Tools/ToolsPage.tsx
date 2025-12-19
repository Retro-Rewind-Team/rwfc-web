import { A } from "@solidjs/router";

export default function ToolsPage() {
    const tools = [
        // {
        //     id: "rank-calculator",
        //     title: "Rank Calculator",
        //     icon: "📊",
        //     description: "Calculate your VS rank from rksys.dat save files. See what stats you need to reach the next rank tier.",
        //     path: "/tools/rank-calculator",
        // },
        {
            id: "font-patcher",
            title: "Font Patcher",
            icon: "✏️",
            description: "Patch Font.szs files to replace tt_kart_extension_font.brfnt with custom fonts.",
            path: "/tools/font-patcher",
        },
        {
            id: "rating-editor",
            title: "Rating Editor",
            icon: "⚙️",
            description: "Edit RRRating.pul files to modify VR/BR values and flags for server ratings.",
            path: "/tools/rating-editor",
        }
    ];

    return (
        <div class="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center py-8">
                <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-3">
                    Community Tools
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                    Helpful utilities created by the Retro Rewind community
                </p>
            </div>

            {/* Tools Grid */}
            <div class="grid gap-6 justify-center grid-cols-[repeat(auto-fit,280px)]">
                {tools.map((tool) => (
                    <A
                        href={tool.path}
                        class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 p-6 transition-all group"
                    >
                        <div class="text-5xl mb-4">{tool.icon}</div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.title}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                            {tool.description}
                        </p>
                    </A>
                ))}
            </div>

            {/* Info Section */}
            <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div class="flex items-start gap-4">
                    <div class="text-3xl">ℹ️</div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            About These Tools
                        </h3>
                        <p class="text-gray-700 dark:text-gray-300">
                            Made by community members for the Retro Rewind community. Have a tool to contribute? 
                            Reach out on Discord!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}