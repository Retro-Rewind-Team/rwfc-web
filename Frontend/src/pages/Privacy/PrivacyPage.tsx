import { Meta, Title } from "@solidjs/meta";
import { AlertBox } from "../../components/common";
import { PRIVACY_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

export default function PrivacyPage() {
    return (
        <>
            <PageHeader
                page="privacy"
                compact
                title="Privacy policy"
                description="What data Retro WFC collects when you play online, and how it is used."
            />
            <div class="max-w-3xl space-y-8">
                <Title>{PRIVACY_META.title}</Title>
                <Meta name="description" content={PRIVACY_META.description} />

                {/* Important Notice */}
                <AlertBox type="info" title="Important Notice">
                    <p>
                        We reserve the right to change this policy at any given time, of which you
                        will be notified via our Discord announcements and the Message of the Day
                        upon logging in.
                    </p>
                </AlertBox>

                {/* Collected data section */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">What data do we collect?</h2>

                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">
                                When visiting rwfc.net
                            </h3>
                            <p class="text-fg-muted mb-3">
                                When connecting to rwfc.net, we collect the following data:
                            </p>
                            <ul class="space-y-2 text-fg-muted ml-6">
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
                            <h3 class="text-lg font-semibold text-fg mb-3">
                                While playing on RWFC
                            </h3>
                            <p class="text-fg-muted mb-3">
                                While playing on RWFC, we collect a few identifiers from your
                                Console to facilitate moderation.
                            </p>
                            <ul class="space-y-2 text-fg-muted ml-6">
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
                                    Your Mii, which may contain the name you have set in your
                                    console and your MAC address
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Who has access */}
                <div class="bg-canvas rounded-lg border border-line p-6">
                    <h2 class="text-2xl font-semibold text-fg mb-4">Who can access your data?</h2>

                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">Team Retro WFC</h3>
                            <p class="text-fg-muted mb-3">
                                Team Retro WFC has access to all data collected.
                            </p>
                        </div>

                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">Retro WFC Moderators</h3>
                            <p class="text-fg-muted mb-3">
                                Moderators may access all data collected while playing on RWFC via
                                the Retro WFC Bot.
                            </p>
                        </div>

                        <div>
                            <h3 class="text-lg font-semibold text-fg mb-3">Third-Parties</h3>
                            <p class="text-fg-muted mb-3">
                                We do not share data with any third-parties, however some
                                information may be shared via Discord in private channels or DMs and
                                over Discord's bot platform.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
