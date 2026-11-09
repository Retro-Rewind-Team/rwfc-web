import { For } from "solid-js";
import { Meta, Title } from "@solidjs/meta";
import { teamData } from "../../constants/teamData";
import { SECTION_COLORS } from "../../utils/constants";
import { buttonClass } from "../../components/common/Button";
import { useClipboard } from "../../hooks/useClipboard";
import TeamMemberCard from "../../components/ui/team/TeamMemberCard";
import type { TeamMember } from "../../types/team";
import { Check, Heart } from "lucide-solid/icons/index";
import { TEAM_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";
import TeamMiis from "../../components/ui/team/TeamMiis";

export default function TeamPage() {
    const { copiedText, copiedPosition, isVisible, copyToClipboard } = useClipboard();

    return (
        <>
            <PageHeader
                page="team"
                title="The team"
                description="The people who build, run and moderate Retro Rewind and the Retro WFC servers."
                visual={<TeamMiis />}
            />
            <div class="space-y-12">
                <Title>{TEAM_META.title}</Title>
                <Meta name="description" content={TEAM_META.description} />
                {/* Copied notification */}
                {copiedText() && (
                    <div
                        class="fixed bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-md z-50 transition-opacity duration-500 text-sm font-medium border-l-4 border-emerald-400 flex items-center gap-2"
                        style={{
                            left: `${copiedPosition().x}px`,
                            top: `${copiedPosition().y - 60}px`,
                            transform: "translateX(-50%)",
                            opacity: isVisible() ? 1 : 0,
                        }}
                    >
                        <Check size={14} class="text-emerald-400 shrink-0" />
                        Copied {copiedText()}
                    </div>
                )}

                {/* Team Sections */}
                <For each={Object.entries(teamData)}>
                    {([section, members]) => {
                        return (
                            <section class="space-y-6 border-t border-line pt-10 first:border-t-0 first:pt-0">
                                {/* One heading treatment for every group; the role colours stay on
                                    each member's card, where they identify the group at a glance. */}
                                <div class="flex items-baseline gap-3">
                                    <h2 class="type-title text-fg">{section}</h2>
                                    <span class="text-sm text-fg-subtle tabular-nums">
                                        {members.length}{" "}
                                        {members.length === 1 ? "person" : "people"}
                                    </span>
                                </div>

                                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                                    <div>
                                        <a
                                            href="https://ko-fi.com/wheelwizard"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class={buttonClass("secondary", "md")}
                                        >
                                            <Heart size={16} aria-hidden="true" />
                                            Support Team WheelWizard
                                            <span class="sr-only"> (opens in a new tab)</span>
                                        </a>
                                    </div>
                                )}
                            </section>
                        );
                    }}
                </For>
            </div>
        </>
    );
}
