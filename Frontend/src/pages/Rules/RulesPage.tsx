import { Scale } from "lucide-solid/icons/index";
import { Meta, Title } from "@solidjs/meta";
import { AlertBox, BrandIcon } from "../../components/common";
import { RULES_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

export default function RulesPage() {
    return (
        <>
            <PageHeader
                page="rules"
                compact
                title="Rules"
                description="The rules for racing on Retro WFC. Read them before you go online; breaking them can lead to a ban."
            />
            <div class="max-w-3xl space-y-8">
                <Title>{RULES_META.title}</Title>
                <Meta name="description" content={RULES_META.description} />

                {/* Important Notice */}
                <AlertBox type="info" title="Important Notice">
                    <p>
                        Punishments are handled on a case-by-case basis, and may differ in lengths
                        if judged necessary by RWFC staff. This rule can be enforced more strictly
                        during peak hours or when a content creator is present.
                    </p>
                </AlertBox>

                {/* Names/Miis Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Names/Miis</h2>

                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">Inappropriate Names</h3>
                            <p class="text-fg-muted mb-3">
                                Any political figure, light profanity, common drugs, suggestive
                                content, etc. will result in the following lengths (only applies to
                                worldwides):
                            </p>
                            <ul class="space-y-2 text-fg-muted ml-6">
                                <li class="flex items-start">
                                    <span class="text-yellow-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>First offense:</strong> 10 minutes
                                    </span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-yellow-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Second offense:</strong> 1 hour
                                    </span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-yellow-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Third offense:</strong> 1 day
                                    </span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-yellow-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Fourth offense and onward:</strong> Up to staff
                                        discretion
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">Harsh Miis/Names</h3>
                            <p class="text-fg-muted mb-3">
                                Extreme political views, hate speech, slurs, etc. will result in the
                                following ban lengths (applies to ALL rooms, including private
                                rooms):
                            </p>
                            <ul class="space-y-2 text-fg-muted ml-6">
                                <li class="flex items-start">
                                    <span class="text-red-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>First offense:</strong> 7 days
                                    </span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-red-600 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Second offense and onward:</strong> Up to staff
                                        discretion
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div class="bg-surface rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <p class="text-fg-muted">
                                <strong>Note:</strong> If a RWFC Staff member thinks that your
                                name/Mii is in violation of the rules that aren't mentioned above,
                                they can kick/ban you with or without a warning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cheating, Bug Abuse, and Exploits Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">
                        Cheating, Bug Abuse, and Exploits
                    </h2>

                    <ul class="space-y-3 text-fg-muted">
                        <li class="flex items-start">
                            <span class="text-red-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>First offense:</strong> 30 days
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-red-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Second offense and onward:</strong> Up to staff discretion
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-red-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Ban evasion:</strong> Will result in a permanent ban for the
                                evasion as well as the main profile
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-red-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Rage cheating:</strong> Mass item cheats, room crashers,
                                etc. will result in a permanent ban
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Trolling/Targeting Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Trolling/Targeting</h2>

                    <AlertBox type="success">
                        <p>
                            <strong>Allowed:</strong> Stop trolling (coming to a stop with a power
                            item) is allowed as long as it is not being used to troll/target
                            players. Playing like a douchebag is allowed as long as you prioritize
                            actually racing. Playing with the sole intent to troll/disrupt is
                            unwanted and <strong>will</strong> result in punishment.
                        </p>
                    </AlertBox>

                    <p class="text-fg-muted mb-3 mt-4">
                        Continued trolling, going backwards, or targeting of a single/group of
                        players will result in the following lengths:
                    </p>

                    <ul class="space-y-2 text-fg-muted ml-6">
                        <li class="flex items-start">
                            <span class="text-orange-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>First offense:</strong> 1 day
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-orange-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Second offense:</strong> 3 days
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-orange-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Third offense and onward:</strong> Up to staff discretion
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Emulator Lag/Speed Up Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Emulator Lag/Speed Up</h2>

                    <p class="text-sm text-fg-subtle italic mb-4">
                        Moving up spots due to FPS, teleporting around, moving down spots due to
                        speed up
                    </p>

                    <ul class="space-y-3 text-fg-muted">
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>One time occurrence:</strong> 10 minutes, to give the user
                                enough time to check their settings then get back on if they wish to
                                do so
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Continued emulator lag:</strong> Up to 1 hour
                            </span>
                        </li>
                    </ul>

                    <div class="mt-4">
                        <AlertBox type="error">
                            <p>
                                <strong>Intentional lag/speed up:</strong> If it is discovered that
                                a player is lagging/speeding up their game on purpose, the bans will
                                result in being 3 days → 7 days → 30 days.
                            </p>
                        </AlertBox>
                    </div>
                </div>

                {/* Installation/Pack Issues Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Installation/Pack Issues</h2>

                    <p class="text-fg-muted">
                        <strong>10 minute ban</strong> so the issue(s) can be fixed. Ban lifted
                        early once fixed.
                    </p>
                </div>

                {/* Suspicious Activity Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Suspicious Activity</h2>

                    <p class="text-fg-muted">
                        If RWFC Staff thinks a player has suspicious activity (playing with cheat
                        codes, potentially ban evading, etc.) they can kick/ban you with or without
                        a warning. This rule can be enforced more strictly during peak hours or when
                        a content creator is present.
                    </p>
                </div>

                {/* Intent of Play Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Intent of Play</h2>

                    <p class="text-fg-muted">
                        If RWFC Staff thinks a player joined with the sole purpose of violating the
                        rules, the ban lengths mentioned above can be bypassed.
                    </p>
                </div>

                {/* Discord Enforcement Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Discord Enforcement</h2>

                    <p class="text-fg-muted">
                        In rare cases, rule violations on Retro WFC may result in sanctions on the
                        Discord server of the distribution where the violation occurred. Enforcement
                        on Discord is at the sole discretion of that distribution's moderation team.
                        In extreme situations, serious violations on a distribution's Discord server
                        may also lead to corresponding action on Retro WFC. In very rare cases,
                        behavior outside of Retro WFC or a distribution's Discord can apply this
                        rule as well.
                    </p>
                </div>

                {/* Competitive Integrity Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Competitive Integrity</h2>

                    <p class="text-fg-muted">
                        To avoid disrupting competitive leagues on Retro WFC, staff will generally
                        delay penalties for rule violations that occur during matches until play
                        concludes. However, in severe cases, staff may impose immediate penalties,
                        including temporary removal or bans, during matches.
                    </p>
                </div>

                {/* VR Leaderboard Flagging Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">VR Leaderboard Flagging</h2>

                    <p class="text-fg-muted mb-3">
                        If a player is suspected of adding VR with external tools or getting
                        impossible gains, they will be marked as suspicious on the VR leaderboard.
                        Heavily abusing disconnects to gain VR or not lose VR will also be
                        considered VR manipulation and will be flagged by staff.
                    </p>

                    <p class="text-fg-muted mb-3">
                        Organizing rooms with the intent to boost VR is prohibited and will result
                        in a flag as well. This includes having high VR players intentionally lose
                        to boost lower VR players. In such cases, both players will be impacted with
                        a flag.
                    </p>

                    <p class="text-fg-muted mb-3">
                        Using game-breaking shortcuts or violating the Intent of Play rule may
                        result in a flag.
                    </p>

                    <p class="text-fg-muted mb-3">
                        Leaderboard flags can be appealed through a ticket just like bans can. Flags
                        can be lifted, on staff discretion, by either reverting the illegitimate VR
                        gains or, especially in case of general VR manipulation, resetting the VR on
                        the license.
                    </p>

                    <div class="bg-surface rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p class="text-fg-muted">
                            <strong>Note:</strong> Leaderboard flagging can also be a result of the
                            Discord Enforcement rule above.
                        </p>
                    </div>
                </div>

                {/* Game-Breaking Shortcuts Section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Game-Breaking Shortcuts</h2>

                    <p class="text-fg-muted mb-3">
                        Certain shortcuts that cause position tracker issues or skip significant
                        parts of a track are prohibited and will result in a kick or temporary ban
                        in addition to a flag.
                    </p>

                    <ul class="space-y-1 text-fg-muted">
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Wii Coconut Mall:</strong> Out of Bounds shortcuts
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>N64 DK Jungle Parkway:</strong> Turnskip shortcut
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>GBA Broken Pier:</strong> Respawn shortcut
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>Tour Snow Land:</strong> Glitch
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>SW2 Cheep Cheep Falls:</strong> Backwards reroute shortcut
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>SW2 DK Spaceport:</strong> Out of bounds shortcuts
                            </span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-yellow-600 mr-2 mt-1">•</span>
                            <span>
                                <strong>SW2 Faraway Oasis:</strong> Cave skip shortcut
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Other WFC Servers */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">
                        Behavior Outside of Retro WFC
                    </h2>

                    <p class="text-fg-muted mb-3">
                        To ensure the safety, competitive integrity, and enjoyment of our community,
                        we occasionally sanction heavily disruptive behavior that occurs outside of
                        Retro WFC. Cheating, ban evasion, harassment, and other similar conduct on
                        services adjacent to Retro WFC can result in penalties on Retro WFC in
                        addition to that service's moderation.
                    </p>

                    <p class="text-fg-muted mb-3">
                        While this rule most often applies to disruptive usage of other WFC
                        services, in extreme cases we may apply this rule when protecting our
                        community from particularly disruptive social behavior as well, such as on
                        Discord or other platforms.
                    </p>
                </div>

                {/* Appealing Section */}
                <AlertBox type="info" icon={<Scale size={20} />} title="Appealing">
                    <p class="mb-4">
                        If you think you were unfairly banned or the length of your ban is not
                        justified, you can always appeal it on the Retro Rewind Discord by creating
                        a ticket.
                    </p>
                    <a
                        href="https://discord.gg/retrorewind"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bg-accent hover:bg-accent-hover text-accent-fg font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
                    >
                        <BrandIcon name="discord" size={20} class="mr-2" />
                        Join Discord to Appeal
                    </a>
                </AlertBox>
            </div>
        </>
    );
}
