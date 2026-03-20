import { A } from "@solidjs/router";
import { PenTool, Settings } from "lucide-solid";
import { AlertBox } from "../../components/common";
import { JSX } from "solid-js";

const tools: { id: string; title: string; icon: () => JSX.Element; description: string; path: string }[] = [
    {
        id: "font-patcher",
        title: "Font Patcher",
        icon: () => <PenTool size={36} />,
        description: "Patch Font.szs files to replace tt_kart_extension_font.brfnt with custom fonts.",
        path: "/tools/font-patcher",
    },
    {
        id: "rating-editor",
        title: "Rating Editor",
        icon: () => <Settings size={36} />,
        description: "Edit RRRating.pul files to modify VR/BR values and flags for server ratings.",
        path: "/tools/rating-editor",
    },
];

export default function ToolsPage() {
    return (
        <div class="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center py-8 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
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
                        class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 p-6 transition-colors group"
                    >
                        <div class="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-4">
                            {tool.icon()}
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.title}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            {tool.description}
                        </p>
                    </A>
                ))}
            </div>

            {/* Info */}
            <AlertBox type="info">
                <p>
                    Made by community members for the Retro Rewind community. Have a tool to contribute? Reach out on Discord!
                </p>
            </AlertBox>
        </div>
    );
}
