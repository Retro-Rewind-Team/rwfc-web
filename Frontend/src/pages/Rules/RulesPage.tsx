import { AlertBox } from "../../components/common";

export default function RulesPage() {
    return (
        <div class="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center">
                <div class="py-4">
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Retro WFC Rules
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Please read and follow these rules to ensure a fair and enjoyable
                        experience for everyone
                    </p>
                </div>
            </div>

            {/* Important Notice */}
            <AlertBox type="info" icon="ℹ️" title="Important Notice">
                <p>
                    Punishments are handled on a case-by-case basis, and may differ in
                    lengths if judged necessary by RWFC staff. This rule can be
                    enforced more strictly during peak hours or when a content creator
                    is present.
                </p>
            </AlertBox>

            {/* Names/Miis Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Names/Miis
                </h2>

                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Inappropriate Names
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            Any political figure, light profanity, common drugs, suggestive
                            content, etc. will result in the following lengths (only applies
                            to worldwides):
                        </p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-300 ml-6">
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
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Harsh Miis/Names
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            Extreme political views, hate speech, slurs, etc. will result in
                            the following ban lengths (applies to ALL rooms, including private
                            rooms):
                        </p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-300 ml-6">
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

                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p class="text-gray-700 dark:text-gray-300">
                            <strong>Note:</strong> If a RWFC Staff member thinks that your
                            name/Mii is in violation of the rules that aren't mentioned above,
                            they can kick/ban you with or without a warning.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cheating/Hacking/Bug Abusing Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Cheating/Hacking/Bug Abusing
                </h2>

                <ul class="space-y-3 text-gray-600 dark:text-gray-300">
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
                            <strong>Ban evasion:</strong> Will result in a permanent ban for
                            the evasion as well as the main profile
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
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Trolling/Targeting
                </h2>

                <AlertBox type="success" icon="">
                    <p>
                        <strong>Allowed:</strong> Stop trolling (coming to a stop with a
                        power item) is allowed as long as it is not being used to
                        troll/target players.
                    </p>
                </AlertBox>

                <p class="text-gray-600 dark:text-gray-300 mb-3 mt-4">
                    Continued trolling or targeting of a single/group of players will
                    result in the following lengths:
                </p>

                <ul class="space-y-2 text-gray-600 dark:text-gray-300 ml-6">
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
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Emulator Lag/Speed Up
                </h2>

                <p class="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
                    Moving up spots due to FPS, teleporting around, moving down spots due
                    to speed up
                </p>

                <ul class="space-y-3 text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                        <span class="text-yellow-600 mr-2 mt-1">•</span>
                        <span>
                            <strong>One time occurrence:</strong> 10 minutes, to give the user
                            enough time to check their settings then get back on if they wish
                            to do so
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
                    <AlertBox type="error" icon="">
                        <p>
                            <strong>Intentional lag/speed up:</strong> If it is discovered that
                            a player is lagging/speeding up their game on purpose, the bans will
                            result in being 3 days → 7 days → 30 days.
                        </p>
                    </AlertBox>
                </div>
            </div>

            {/* Installation/Pack Issues Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Installation/Pack Issues
                </h2>

                <p class="text-gray-600 dark:text-gray-300">
                    <strong>10 minute ban</strong> so the issue(s) can be fixed. Ban
                    lifted early once fixed.
                </p>
            </div>

            {/* Suspicious Activity Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Suspicious Activity
                </h2>

                <p class="text-gray-600 dark:text-gray-300">
                    If RWFC Staff thinks a player has suspicious activity (playing with
                    cheat codes, potentially ban evading, etc.) they can kick/ban you with
                    or without a warning. This rule can be enforced more strictly during
                    peak hours or when a content creator is present.
                </p>
            </div>

            {/* Intent of Play Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Intent of Play
                </h2>

                <p class="text-gray-600 dark:text-gray-300">
                    If RWFC Staff thinks a player joined with the sole purpose of
                    violating the rules, the ban lengths mentioned above can be bypassed.
                </p>
            </div>

            {/* Discord Enforcement Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Discord Enforcement
                </h2>

                <p class="text-gray-600 dark:text-gray-300">
                    In rare cases, rule violations on Retro WFC may result in sanctions on
                    the Discord server of the distribution where the violation occurred.
                    Enforcement on Discord is at the sole discretion of that
                    distribution's moderation team. In extreme situations, serious
                    violations on a distribution's Discord server may also lead to
                    corresponding action on Retro WFC.
                </p>
            </div>

            {/* Competitive Integrity Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Competitive Integrity
                </h2>

                <p class="text-gray-600 dark:text-gray-300">
                    To avoid disrupting competitive leagues on Retro WFC, staff will
                    generally delay penalties for rule violations that occur during
                    matches until play concludes. However, in severe cases, staff may
                    impose immediate penalties, including temporary removal or bans,
                    during matches.
                </p>
            </div>

            {/* Appealing Section */}
            <AlertBox type="info" icon="⚖️" title="Appealing">
                <p class="mb-4">
                    If you think you were unfairly banned or the length of your ban is
                    not justified, you can always appeal it on the Retro Rewind
                    Discord by creating a ticket.
                </p>
                <a
                    href="https://discord.gg/retrorewind"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center"
                >
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    Join Discord to Appeal
                </a>
            </AlertBox>
        </div>
    );
}