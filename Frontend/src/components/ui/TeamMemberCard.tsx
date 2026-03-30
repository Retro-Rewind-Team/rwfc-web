import { Heart } from "lucide-solid";
import { Show } from "solid-js";
import type { TeamMember } from "../../types/team";

interface TeamMemberCardProps {
  member: TeamMember;
  roleColor: { color: string; accent: string; shadowColor: string } | undefined;
  onCopy: (text: string, label: string, event: MouseEvent) => void;
}

export default function TeamMemberCard(props: TeamMemberCardProps) {
    return (
        <div class="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)]">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors h-full flex flex-col">
                {/* Profile Picture */}
                <div class="relative w-24 h-24 mx-auto mb-4">
                    <Show
                        when={props.member.image}
                        fallback={
                            <div
                                class={`w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold ${props.roleColor?.accent || "bg-gray-400"}`}
                            >
                                {props.member.name.charAt(0).toUpperCase()}
                            </div>
                        }
                    >
                        <img
                            src={props.member.image!}
                            alt={props.member.name}
                            class="w-full h-full rounded-full object-cover shadow-sm"
                        />
                    </Show>
                </div>

                {/* Name */}
                <h3 class="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                    {props.member.name}
                </h3>

                {/* Role */}
                <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-3 min-h-[40px]">
                    {props.member.role}
                </p>

                {/* Discord */}
                <button
                    onClick={(e) =>
                        props.onCopy(props.member.discord, "Discord username", e)
                    }
                    class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 w-full transition-colors"
                    title="Click to copy Discord username"
                >
                    {/* Discord SVG - intentionally kept, brand icon */}
                    <svg
                        class="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    <span class="truncate">{props.member.discord}</span>
                </button>

                {/* Friend Code */}
                <Show when={props.member.fc}>
                    <button
                        onClick={(e) => props.onCopy(props.member.fc!, "friend code", e)}
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
                        <span class="text-xs font-semibold">FC: {props.member.fc}</span>
                    </button>
                </Show>

                {/* Donation */}
                <div class="mt-auto">
                    <Show when={props.member.donation}>
                        <a
                            href={props.member.donation!}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-4 py-2.5 rounded-md transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Heart size={16} />
              Support
                        </a>
                    </Show>
                </div>
            </div>
        </div>
    );
}
