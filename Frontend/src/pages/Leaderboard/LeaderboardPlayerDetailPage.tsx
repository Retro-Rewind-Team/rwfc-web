import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { ChartBar, Download, TriangleAlert, Trophy, UserX } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { usePlayer } from "../../hooks";
import { API_BASE_URL } from "../../services/api/client";
import { DYNAMIC_META_DEFAULTS } from "../../constants/pageMeta";
import { formatLastSeen } from "../../utils";
import {
    MiiComponent,
    PlayerAnalyticsCard,
    PlayerBadges,
    PlayerRaceStatsCard,
    VehiclePreferenceBadge,
    VRHistoryChartComponent,
    VRStatsCard,
    VRTierInfo,
    VRTierNumberPlate,
} from "../../components/ui";
import { LoadingSpinner, Tooltip } from "../../components/common";
import PageHeader from "../../components/common/PageHeader";

export default function PlayerDetailPage() {
    const params = useParams();
    // Accessor: the router reuses this component when only the friend code changes, so reading
    // params once showed the previously-viewed player after a back/forward navigation.
    const { playerQuery, legacyPlayer, hasLegacyData, isPlayerNotFound } = usePlayer(
        () => params.friendCode ?? "0000-0000-0000",
    );

    return (
        <>
            <PageHeader
                page="vrPlayer"
                compact
                crumbs={[{ label: "VR leaderboard", href: "/vr" }]}
                title={playerQuery.data?.name ?? "Player"}
                description="VR, rank and race history for this racer on Retro WFC."
            />
            <div class="space-y-6">
                <Title>
                    {playerQuery.data
                        ? `${playerQuery.data.name} | Retro Rewind`
                        : DYNAMIC_META_DEFAULTS.leaderboardPlayer.title}
                </Title>
                <Meta
                    name="description"
                    content={DYNAMIC_META_DEFAULTS.leaderboardPlayer.description}
                />

                {/* Loading */}
                <Show when={playerQuery.isLoading}>
                    <div class="bg-canvas rounded-lg border border-line p-6">
                        <div class="flex justify-center items-center py-12 gap-4">
                            <LoadingSpinner />
                            <p class="text-fg-muted">Loading player data...</p>
                        </div>
                    </div>
                </Show>

                {/* Not Found */}
                <Show when={isPlayerNotFound()}>
                    <div class="bg-canvas rounded-lg border border-line p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-fg-subtle">
                                <UserX size={56} />
                            </div>
                            <h2 class="text-2xl font-semibold text-fg">Player Not Found</h2>
                            <p class="text-fg-muted">
                                No player found with friend code:{" "}
                                <code class="font-mono bg-surface px-2 py-1 rounded">
                                    {params.friendCode}
                                </code>
                            </p>
                            <p class="text-sm text-gray-500">
                                This player might not have registered on Retro WFC yet, or the
                                friend code may be incorrect.
                            </p>
                            <div class="pt-4">
                                <A
                                    href="/vr"
                                    class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                                >
                                    <ChartBar size={18} />
                                    Browse Leaderboard
                                </A>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Error */}
                <Show when={playerQuery.isError && !isPlayerNotFound()}>
                    <div class="bg-canvas rounded-lg border border-red-200 dark:border-red-800 p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-red-400">
                                <TriangleAlert size={48} />
                            </div>
                            <h2 class="text-2xl font-semibold text-red-900 dark:text-red-100">
                                Error Loading Player
                            </h2>
                            <p class="text-red-600 dark:text-red-400">
                                An error occurred while loading player data.
                            </p>
                            <div class="pt-4">
                                <button
                                    type="button"
                                    onClick={() => playerQuery.refetch()}
                                    class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Player Data */}
                <Show when={playerQuery.data}>
                    {(player) => (
                        <div class="space-y-6">
                            {/* Player Header Card */}
                            <div class="bg-canvas rounded-lg border border-line p-6">
                                <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <div class="flex items-center space-x-6">
                                        <div class="flex flex-col items-center">
                                            {/* Mii with download overlay */}
                                            <div class="relative group mb-3">
                                                <MiiComponent
                                                    playerName={player().name}
                                                    friendCode={player().friendCode}
                                                    size="lg"
                                                />
                                                <a
                                                    href={`${API_BASE_URL}/leaderboard/player/${player().friendCode}/mii/download`}
                                                    download={`${player().name}.mii`}
                                                    class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
                                                    title="Download Mii"
                                                >
                                                    <Download size={28} class="text-white" />
                                                </a>
                                            </div>
                                            <VRTierNumberPlate
                                                rank={player().rank}
                                                vr={player().vr}
                                                isSuspicious={player().isSuspicious}
                                                size="lg"
                                            />
                                        </div>

                                        <div>
                                            <div class="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 class="sr-only">{player().name}</h2>
                                                <VehiclePreferenceBadge
                                                    vehiclePreference={player().vehiclePreference}
                                                    vehicleRank={player().vehicleRank}
                                                />
                                                <Show when={player().isSuspicious}>
                                                    <Tooltip text="This player has been flagged for suspicious VR activity">
                                                        <span class="inline-flex items-center gap-1.5 bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap cursor-help">
                                                            <TriangleAlert size={14} />
                                                            Suspicious
                                                        </span>
                                                    </Tooltip>
                                                </Show>
                                            </div>
                                            <div class="mb-3">
                                                <PlayerBadges badges={player().badges} size="md" />
                                            </div>
                                            <div class="space-y-1 text-fg-muted">
                                                <p>
                                                    <span class="font-medium">Friend Code:</span>{" "}
                                                    {player().friendCode}
                                                </p>
                                                <p class="flex items-center gap-1.5">
                                                    <span class="font-medium">Last Seen:</span>{" "}
                                                    <Show
                                                        when={
                                                            formatLastSeen(player().lastSeen) ===
                                                            "Now Online"
                                                        }
                                                        fallback={
                                                            <span>
                                                                {formatLastSeen(player().lastSeen)}
                                                            </span>
                                                        }
                                                    >
                                                        <span class="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            Now Online
                                                        </span>
                                                    </Show>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VR Display */}
                                    <div class="text-center">
                                        <div class="text-5xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                            {player().vr.toLocaleString()}
                                        </div>
                                        <div class="text-lg text-fg-muted font-medium mb-3">
                                            Current VR
                                        </div>
                                        <Show when={hasLegacyData() && legacyPlayer()}>
                                            {(legacy) => (
                                                <div class="pt-3 border-t border-line">
                                                    <div class="flex items-center justify-center gap-2 mb-1">
                                                        <Trophy
                                                            size={18}
                                                            class="text-amber-500 dark:text-amber-400"
                                                        />
                                                        <div class="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                                                            {legacy().vr.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div class="text-sm text-gray-500 font-medium">
                                                        Legacy VR (#{legacy().rank})
                                                    </div>
                                                </div>
                                            )}
                                        </Show>
                                    </div>
                                </div>
                            </div>

                            {/* VR Tier Progress */}
                            <Show when={!player().isSuspicious}>
                                <div class="bg-canvas rounded-lg border border-line p-6">
                                    <div class="flex items-center gap-2 mb-4">
                                        <h2 class="text-2xl font-semibold text-fg">
                                            VR Tier Progress
                                        </h2>
                                    </div>
                                    <VRTierInfo vr={player().vr} showProgress={true} />
                                </div>
                            </Show>

                            {/* VR Stats Cards */}
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <VRStatsCard
                                    value={player().vrStats.last24Hours}
                                    label="Last 24 Hours"
                                />
                                <VRStatsCard value={player().vrStats.lastWeek} label="Last Week" />
                                <VRStatsCard
                                    value={player().vrStats.lastMonth}
                                    label="Last Month"
                                />
                            </div>

                            <VRHistoryChartComponent friendCode={player().friendCode} />
                            <PlayerRaceStatsCard pid={player().pid} />
                            <PlayerAnalyticsCard pid={player().pid} />
                        </div>
                    )}
                </Show>
            </div>
        </>
    );
}
