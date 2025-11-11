import { createSignal, For } from "solid-js";
import { teamData } from "../../utils/teamData";
import type { TeamMember } from "../../types/team";

// Racing-inspired color scheme with shadow colors
const sectionColors: Record<string, { color: string; accent: string; shadowColor: string }> = {
    "Project Leader": {
        color: "text-red-600 dark:text-red-400",
        accent: "border-red-500",
        shadowColor: "220, 38, 38", // red-600 RGB
    },
    "Team Retro WFC": {
        color: "text-cyan-600 dark:text-cyan-400",
        accent: "border-cyan-500",
        shadowColor: "8, 145, 178", // cyan-600 RGB
    },
    "Team WheelWizard": {
        color: "text-purple-600 dark:text-purple-400",
        accent: "border-purple-500",
        shadowColor: "147, 51, 234", // purple-600 RGB
    },
    "Website Creator": {
        color: "text-indigo-600 dark:text-indigo-400",
        accent: "border-indigo-500",
        shadowColor: "79, 70, 229", // indigo-600 RGB
    },
    Administrators: {
        color: "text-orange-600 dark:text-orange-400",
        accent: "border-orange-500",
        shadowColor: "234, 88, 12", // orange-600 RGB
    },
    Moderators: {
        color: "text-emerald-600 dark:text-emerald-400",
        accent: "border-emerald-500",
        shadowColor: "5, 150, 105", // emerald-600 RGB
    },
    "Community Staff": {
        color: "text-teal-600 dark:text-teal-400",
        accent: "border-teal-500",
        shadowColor: "13, 148, 136", // teal-600 RGB
    },
    "RWFC Moderators": {
        color: "text-amber-600 dark:text-amber-400",
        accent: "border-amber-500",
        shadowColor: "217, 119, 6", // amber-600 RGB
    },
    Developers: {
        color: "text-yellow-600 dark:text-yellow-400",
        accent: "border-yellow-500",
        shadowColor: "202, 138, 4", // yellow-600 RGB
    },
    Translators: {
        color: "text-violet-600 dark:text-violet-400",
        accent: "border-violet-500",
        shadowColor: "124, 58, 237", // violet-600 RGB
    },
    "BKT Updaters": {
        color: "text-pink-600 dark:text-pink-400",
        accent: "border-pink-500",
        shadowColor: "219, 39, 119", // pink-600 RGB
    },
    "Mogi Staff": {
        color: "text-pink-600 dark:text-pink-400",
        accent: "border-pink-500",
        shadowColor: "219, 39, 119", // pink-600 RGB
    },
    "Mogi Updaters": {
        color: "text-sky-600 dark:text-sky-400",
        accent: "border-sky-500",
        shadowColor: "2, 132, 199", // sky-600 RGB
    },
};

export default function TeamPage() {
    const [copiedText, setCopiedText] = createSignal<string>("");
    const [copiedPosition, setCopiedPosition] = createSignal<{
        x: number;
        y: number;
    }>({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = createSignal(false);

    const copyToClipboard = (text: string, label: string, event: MouseEvent) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setCopiedPosition({ x: event.clientX, y: event.clientY });
        setIsVisible(true);

        setTimeout(() => setIsVisible(false), 2000);
        setTimeout(() => setCopiedText(""), 2500);
    };

    return (
        <div class="max-w-7xl mx-auto space-y-12">
            {/* Copied notification - simpler design */}
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

            {/* Header - centered */}
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
                    const sectionColor = sectionColors[section];
                    return (
                        <section class="space-y-8">
                            {/* Section Header - centered with accent lines */}
                            <div class="flex items-center justify-center gap-4">
                                <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 max-w-xs"></div>
                                <h2
                                    class={`text-3xl font-bold ${sectionColor?.color || "text-gray-900 dark:text-white"} px-4`}
                                >
                                    {section}
                                </h2>
                                <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 max-w-xs"></div>
                            </div>

                            {/* Grid layout - centered with consistent card sizes */}
                            <div class="flex flex-wrap justify-center gap-6">
                                <For each={members}>
                                    {(member: TeamMember) => {
                                        const roleColor = sectionColors[section];
                                        const shadowRgb = roleColor?.shadowColor || "156, 163, 175";
                                        return (
                                            <div class="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] group">
                                                {/* Main card - colored shadow on hover using inline style */}
                                                <div 
                                                    class="bg-white dark:bg-gray-800 rounded-lg p-6 transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 h-full flex flex-col"
                                                    style={{
                                                        "box-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(${shadowRgb}, 0.3), 0 4px 6px -4px rgba(${shadowRgb}, 0.2)`;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
                                                    }}
                                                >
                                                    {/* Profile Picture - simple ring on hover */}
                                                    <div class="relative w-24 h-24 mx-auto mb-4">
                                                        <div
                                                            class={`absolute inset-0 rounded-full border-3 ${roleColor?.accent || "border-gray-300"} opacity-0 group-hover:opacity-100 transition-opacity`}
                                                        ></div>
                                                        {member.image ? (
                                                            <img
                                                                src={member.image}
                                                                alt={member.name}
                                                                class="w-full h-full rounded-full object-cover shadow-sm"
                                                            />
                                                        ) : (
                                                            <div
                                                                class={`w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm ${roleColor?.accent || "bg-gray-400"} bg-current`}
                                                            >
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Name */}
                                                    <h3 class="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                                                        {member.name}
                                                    </h3>

                                                    {/* Role Description */}
                                                    <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-3 min-h-[40px]">
                                                        {member.role}
                                                    </p>

                                                    {/* Discord Username */}
                                                    <button
                                                        onClick={(e) =>
                                                            copyToClipboard(
                                                                member.discord,
                                                                "Discord username",
                                                                e
                                                            )
                                                        }
                                                        class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 w-full transition-colors"
                                                        title="Click to copy Discord username"
                                                    >
                                                        <svg
                                                            class="w-4 h-4 flex-shrink-0"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                                                        </svg>
                                                        <span class="truncate">{member.discord}</span>
                                                    </button>

                                                    {/* Friend Code */}
                                                    {member.fc && (
                                                        <button
                                                            onClick={(e) =>
                                                                copyToClipboard(member.fc!, "friend code", e)
                                                            }
                                                            class="flex items-center justify-center gap-2 text-xs text-cyan-700 dark:text-cyan-300 mb-4 font-mono bg-cyan-50 dark:bg-cyan-900/20 py-2 px-3 rounded-md border border-cyan-200 dark:border-cyan-800 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:border-cyan-300 dark:hover:border-cyan-700 w-full transition-colors"
                                                            title="Click to copy friend code"
                                                        >
                                                            <svg
                                                                class="w-3.5 h-3.5 flex-shrink-0"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    stroke-width="2"
                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                />
                                                            </svg>
                                                            <span class="text-xs font-semibold">
                                                                FC: {member.fc}
                                                            </span>
                                                        </button>
                                                    )}

                                                    {/* Donation Link - solid color */}
                                                    <div class="mt-auto">
                                                        {member.donation && (
                                                            <div class="text-center">
                                                                <a
                                                                    href={member.donation}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="inline-flex items-center justify-center w-full text-sm font-semibold px-4 py-2.5 rounded-md transition-all bg-purple-600 hover:bg-purple-700 text-white"
                                                                >
                                                                    <svg
                                                                        class="w-4 h-4 mr-2"
                                                                        fill="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                                    </svg>
                                                                    <span>Support</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>

                            {/* Team WheelWizard Support Button - centered */}
                            {section === "Team WheelWizard" && (
                                <div class="flex justify-center mt-4">
                                    <a
                                        href="https://ko-fi.com/wheelwizard"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow hover:shadow-md flex items-center gap-2"
                                    >
                                        <svg
                                            class="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
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