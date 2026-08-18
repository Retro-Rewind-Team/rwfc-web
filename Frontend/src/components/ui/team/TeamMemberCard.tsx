import { Heart, Users } from "lucide-solid";
import { Show } from "solid-js";
import type { TeamMember } from "../../../types/team";

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
                    type="button"
                    onClick={(e) => props.onCopy(props.member.discord, "Discord username", e)}
                    class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 w-full transition-colors"
                    title="Click to copy Discord username"
                >
                    {/* Discord SVG  */}
                    <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    <span class="truncate">{props.member.discord}</span>
                </button>

                <Show when={props.member.forge}>
                    <button
                        type="button"
                        onClick={(_) => open(props.member.forge!)}
                        class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded-md border border-gray-200 dark:border-gray-600 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 w-full transition-colors"
                        title="Click to open Git"
                    >
                        <svg class="w-4 h-4 flex-shrink-0" viewBox="0 -2 100 100">
                            <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" fill="black"/>
                        </svg>
                    <span class="truncate">{props.member.forge!.split("/").at(-1)}</span>
                    </button>
                </Show>

                {/* Friend Code */}
                <Show when={props.member.fc}>
                    <button
                        type="button"
                        onClick={(e) => props.onCopy(props.member.fc!, "friend code", e)}
                        class="flex items-center justify-center gap-2 text-xs text-cyan-700 dark:text-cyan-300 mb-4 font-mono bg-cyan-50 dark:bg-cyan-900/20 py-2 px-3 rounded-md border border-cyan-200 dark:border-cyan-800 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:border-cyan-300 dark:hover:border-cyan-700 w-full transition-colors"
                        title="Click to copy friend code"
                    >
                        <Users size={14} class="flex-shrink-0" />
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
