import { For } from "solid-js";
import { teamData } from "../../utils/teamData";
import { SECTION_COLORS } from "../../utils/constants";
import { useClipboard } from "../../hooks/useClipboard";
import { TeamMemberCard } from "../../components/ui";
import type { TeamMember } from "../../types/team";

export default function TeamPage() {
    const { copiedText, copiedPosition, isVisible, copyToClipboard } = useClipboard();

    return (
        <div class="max-w-7xl mx-auto space-y-12">
            {/* Copied notification */}
            {copiedText() && (
                <div
                    class="fixed bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-500 text-sm font-medium border-l-4 border-emerald-400"
                    style={{
                        left: `${copiedPosition().x}px`,
                        top: `${copiedPosition().y - 60}px`,
                        transform: "translateX(-50%)",
                        opacity: isVisible() ? 1 : 0,
                    }}
                >
                    ✓ Copied {copiedText()}
                </div>
            )}

            {/* Header */}
            <div class="text-center">
                <div class="py-8">
                    <h1 class="text-5xl font-bold mb-3 text-gray-900 dark:text-white">
                        The Retro Rewind Team
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Meet the people who make Retro Rewind possible
                    </p>
                </div>
            </div>

            {/* Team Sections */}
            <For each={Object.entries(teamData)}>
                {([section, members]) => {
                    const sectionColor = SECTION_COLORS[section];
                    return (
                        <section class="space-y-8">
                            {/* Section Header */}
                            <div class="flex items-center justify-center gap-4">
                                <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 max-w-xs"></div>
                                <h2
                                    class={`text-3xl font-bold ${sectionColor?.color || "text-gray-900 dark:text-white"} px-4`}
                                >
                                    {section}
                                </h2>
                                <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 max-w-xs"></div>
                            </div>

                            {/* Grid layout */}
                            <div class="flex flex-wrap justify-center gap-6">
                                <For each={members}>
                                    {(member: TeamMember) => (
                                        <TeamMemberCard
                                            member={member}
                                            roleColor={SECTION_COLORS[section]}
                                            onCopy={copyToClipboard}
                                        />
                                    )}
                                </For>
                            </div>

                            {/* Team WheelWizard Support Button */}
                            {section === "Team WheelWizard" && (
                                <div class="flex justify-center mt-4">
                                    <a
                                        href="https://ko-fi.com/wheelwizard"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow hover:shadow-md flex items-center gap-2"
                                    >
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        <span>Support Team WheelWizard</span>
                                    </a>
                                </div>
                            )}
                        </section>
                    );
                }}
            </For>
        </div>
    );
}