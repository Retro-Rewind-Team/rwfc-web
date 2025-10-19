import { createSignal, For } from "solid-js";
import { teamData } from "../../utils/teamData";
import type { TeamMember } from "../../types/team";

// Define color schemes for each section
const sectionColors: Record<string, { from: string; via: string; to: string }> =
  {
      "Project Leader": {
          from: "from-blue-600",
          via: "via-blue-500",
          to: "to-cyan-500",
      },
      "Team Retro WFC": {
          from: "from-sky-500",
          via: "via-cyan-400",
          to: "to-blue-400",
      },
      "Team WheelWizard": {
          from: "from-purple-600",
          via: "via-pink-500",
          to: "to-rose-500",
      },
      "Website Creator": {
          from: "from-blue-600",
          via: "via-purple-600",
          to: "to-pink-600",
      },
      Administrators: {
          from: "from-red-600",
          via: "via-red-500",
          to: "to-orange-500",
      },
      Moderators: {
          from: "from-green-600",
          via: "via-green-500",
          to: "to-emerald-500",
      },
      "Community Staff": {
          from: "from-green-700",
          via: "via-green-600",
          to: "to-teal-600",
      },
      "RWFC Moderators": {
          from: "from-orange-600",
          via: "via-orange-500",
          to: "to-amber-500",
      },
      Developers: {
          from: "from-yellow-500",
          via: "via-amber-400",
          to: "to-yellow-400",
      },
      Translators: {
          from: "from-purple-600",
          via: "via-purple-500",
          to: "to-violet-500",
      },
      "Mogi Staff": {
          from: "from-pink-500",
          via: "via-pink-400",
          to: "to-rose-400",
      },
      "Mogi Updaters": {
          from: "from-cyan-600",
          via: "via-cyan-500",
          to: "to-teal-500",
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

        // Start fading out after 2 seconds
        setTimeout(() => setIsVisible(false), 2000);
        // Clear the text after fade animation completes
        setTimeout(() => setCopiedText(""), 2500);
    };

    return (
        <div class="max-w-7xl mx-auto space-y-12">
            {/* Copied notification */}
            {copiedText() && (
                <div
                    class="fixed bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-xl z-50 transition-opacity duration-500 text-sm font-medium"
                    style={{
                        left: `${copiedPosition().x}px`,
                        top: `${copiedPosition().y - 60}px`,
                        transform: "translateX(-50%)",
                        opacity: isVisible() ? 1 : 0,
                    }}
                >
          ✓ Copied {copiedText()}!
                </div>
            )}

            {/* Header with gradient background */}
            <div class="text-center relative">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
                <div class="relative py-12">
                    <h1 class="text-5xl font-bold mb-4 transition-colors">
                        <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              The Retro Rewind Team
                        </span>
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-300 transition-colors">
            Meet the amazing people who make Retro Rewind possible
                    </p>
                </div>
            </div>

            {/* Team Sections */}
            <For each={Object.entries(teamData)}>
                {([section, members]) => (
                    <section class="space-y-6">
                        {/* Section Header */}
                        <div class="flex items-center gap-4">
                            <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                            <h2 class="text-3xl font-bold transition-colors flex-shrink-0">
                                <span
                                    class={`bg-gradient-to-r ${sectionColors[section]?.from || "from-blue-600"} ${sectionColors[section]?.via || "via-purple-600"} ${sectionColors[section]?.to || "to-pink-600"} bg-clip-text text-transparent`}
                                >
                                    {section}
                                </span>
                            </h2>
                            <div class="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                        </div>

                        <div class="flex flex-wrap justify-center gap-6">
                            <For each={members}>
                                {(member: TeamMember) => {
                                    return (
                                        <div class="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] group relative">
                                            {/* Glow effect on hover */}
                                            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>

                                            {/* Main card */}
                                            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                                                {/* Profile Picture with ring */}
                                                <div class="relative w-24 h-24 mx-auto mb-4">
                                                    <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow"></div>
                                                    <div class="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-full"></div>
                                                    {member.image ? (
                                                        <img
                                                            src={member.image}
                                                            alt={member.name}
                                                            class="relative w-full h-full rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300 p-1"
                                                        />
                                                    ) : (
                                                        <div class="relative w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300 p-1">
                                                            <div class="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name */}
                                                <h3 class="text-xl font-bold text-center mb-2 transition-colors text-gray-900 dark:text-white">
                                                    {member.name}
                                                </h3>

                                                {/* Role Description */}
                                                <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-3 min-h-[40px] transition-colors">
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
                                                    class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 w-full"
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
                                                        class="flex items-center justify-center gap-2 text-xs text-blue-700 dark:text-blue-300 mb-4 font-mono bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 py-2 px-3 rounded-lg transition-colors border border-blue-200 dark:border-blue-700 cursor-pointer hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 hover:border-blue-300 dark:hover:border-blue-600 w-full"
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

                                                {/* Donation Link */}
                                                <div class="mt-auto">
                                                    {member.donation && (
                                                        <div class="text-center">
                                                            <a
                                                                href={member.donation}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                class="group/btn relative inline-flex items-center justify-center w-full text-sm font-semibold px-4 py-2.5 rounded-lg transition-all overflow-hidden"
                                                            >
                                                                <div class="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 transition-transform group-hover/btn:scale-105"></div>
                                                                <div class="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                                                <svg
                                                                    class="w-4 h-4 mr-2 relative z-10 text-white"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                                </svg>
                                                                <span class="relative z-10 text-white">
                                  Support
                                                                </span>
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

                        {/* Team WheelWizard Support Button */}
                        {section === "Team WheelWizard" && (
                            <div class="flex justify-center mt-4">
                                <a
                                    href="https://ko-fi.com/wheelwizard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                    <svg
                                        class="w-5 h-5 relative z-10"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    <span class="relative z-10">Support Team WheelWizard</span>
                                </a>
                            </div>
                        )}
                    </section>
                )}
            </For>

            {/* Thank You Section with enhanced gradient */}
            <div class="relative rounded-2xl p-10 text-white text-center mt-12 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div class="relative max-w-2xl mx-auto">
                    <h2 class="text-4xl font-bold mb-4">Thank You!</h2>
                    <p class="text-xl text-blue-50">
            To everyone who contributes to making Retro Rewind an amazing
            experience for the community
                    </p>
                </div>
            </div>
        </div>
    );
}
