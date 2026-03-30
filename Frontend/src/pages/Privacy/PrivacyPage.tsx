import { AlertBox } from "../../components/common";

export default function PrivacyPage() {
    return (
        <div class="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div class="text-center">
                <div class="py-4">
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Retro WFC Privacy Policy
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        What data we collect and how we use it
                    </p>
                </div>
            </div>

            {/* Important Notice */}
            <AlertBox type="info" title="Important Notice">
                <p>
                    We reserve the right to change this policy at any given
                    time, of which you will be notified via our Discord
                    announcements and the Message of the Day upon logging
                    in.
                </p>
            </AlertBox>

            {/* Collected data section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    What data do we collect?
                </h2>

                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            When visiting rwfc.net
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            When connecting to rwfc.net, we collect the following data:
                        </p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-300 ml-6">
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your IP address
                            </li>
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your browser useragent
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            While playing on RWFC
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            While playing on RWFC, we collect a few identifiers
                            from your Console to facilitate moderation.
                        </p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-300 ml-6">
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your IP address
                            </li>
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your Device ID (from your NAND)
                            </li>
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your console serial number
                            </li>
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your Discord profile (if you choose to link your account)
                            </li>
                            <li class="flex items-start">
                                <span class="text-blue-600 mr-2 mt-1">•</span>
                                Your Mii, which may contain the name you have
                                set in your console and your MAC address
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Who has access */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Who can access your data?
                </h2>

                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Team Retro WFC
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            Team Retro WFC has access to all data collected.
                        </p>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Retro WFC Moderators
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            Moderators may access all data collected while
                            playing on RWFC via the Retro WFC Bot.
                        </p>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Third-Parties
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            We do not share data with any third-parties,
                            however some information may be shared via Discord
                            in private channels or DMs and over Discord's bot
                            platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
