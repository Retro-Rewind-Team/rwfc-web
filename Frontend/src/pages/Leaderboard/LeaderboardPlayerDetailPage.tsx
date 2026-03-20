import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { ChevronLeft, BarChart, Trophy, AlertTriangle, Download, UserX } from "lucide-solid";
import { usePlayer } from "../../hooks";
import { formatLastSeen } from "../../utils";
import { PlayerBadges, PlayerRaceStatsCard, VRHistoryChartComponent, VRStatsCard } from "../../components/ui";
import { MiiComponent, VRTierInfo, VRTierNumberPlate } from "../../components/ui";
import { LoadingSpinner } from "../../components/common";

export default function PlayerDetailPage() {
    const params = useParams();
    const { playerQuery, legacyPlayer, hasLegacyData, isPlayerNotFound } = usePlayer(params.friendCode);

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/vr"
                    class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <ChevronLeft size={16} />
                    Back to Leaderboard
                </A>
            </div>

            {/* Loading */}
            <Show when={playerQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-center items-center py-12 gap-4">
                        <LoadingSpinner />
                        <p class="text-gray-600 dark:text-gray-300">Loading player data...</p>
                    </div>
                </div>
            </Show>

            {/* Not Found */}
            <Show when={isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-gray-300 dark:text-gray-600">
                            <UserX size={56} />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Player Not Found
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">
                            No player found with friend code:{" "}
                            <code class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {params.friendCode}
                            </code>
                        </p>
                        <p class="text-sm text-gray-500">
                            This player might not have registered on Retro WFC yet, or the friend code may be incorrect.
                        </p>
                        <div class="pt-4">
                            <A
                                href="/vr"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <BarChart size={18} />
                                Browse Leaderboard
                            </A>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Error */}
            <Show when={playerQuery.isError && !isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center text-red-400">
                            <AlertTriangle size={48} />
                        </div>
                        <h2 class="text-2xl font-bold text-red-900 dark:text-red-100">
                            Error Loading Player
                        </h2>
                        <p class="text-red-600 dark:text-red-400">
                            An error occurred while loading player data.
                        </p>
                        <div class="pt-4">
                            <button
                                onClick={() => playerQuery.refetch()}
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
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
                                                href={`/api/leaderboard/player/${player().friendCode}/mii/download`}
                                                download={`${player().name}.mii`}
                                                class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg opacity-0 group-hover:opacity-100"
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
                                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                                                {player().name}
                                            </h1>
                                            <Show when={player().isSuspicious}>
                                                <span class="inline-flex items-center gap-1.5 bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                                                    <AlertTriangle size={14} />
                                                    Suspicious
                                                </span>
                                            </Show>
                                        </div>
                                        <div class="mb-3">
                                            <PlayerBadges friendCode={player().friendCode} size="md" />
                                        </div>
                                        <div class="space-y-1 text-gray-600 dark:text-gray-300">
                                            <p>
                                                <span class="font-medium">Friend Code:</span>{" "}
                                                {player().friendCode}
                                            </p>
                                            <p>
                                                <span class="font-medium">Last Seen:</span>{" "}
                                                {formatLastSeen(player().lastSeen)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* VR Display */}
                                <div class="text-center">
                                    <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        {player().vr.toLocaleString()}
                                    </div>
                                    <div class="text-lg text-gray-600 dark:text-gray-400 font-medium mb-3">
                                        Current VR
                                    </div>
                                    <Show when={hasLegacyData() && legacyPlayer()}>
                                        {(legacy) => (
                                            <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div class="flex items-center justify-center gap-2 mb-1">
                                                    <Trophy size={18} class="text-amber-500 dark:text-amber-400" />
                                                    <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
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
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex items-center gap-2 mb-4">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">VR Tier Progress</h2>
                            </div>
                            <VRTierInfo
                                vr={player().vr}
                                isSuspicious={player().isSuspicious}
                                showProgress={true}
                            />
                        </div>

                        {/* VR Stats Cards */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <VRStatsCard value={player().vrStats.last24Hours} label="Last 24 Hours" />
                            <VRStatsCard value={player().vrStats.lastWeek} label="Last Week" />
                            <VRStatsCard value={player().vrStats.lastMonth} label="Last Month" />
                        </div>

                        {/* Player Summary */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <div class="flex items-center gap-2 mb-4">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Player Summary</h2>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rankings</h3>
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Overall Rank:</span>
                                            <span class="font-medium text-gray-900 dark:text-white">#{player().rank}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Current VR:</span>
                                            <span class="font-medium text-gray-900 dark:text-white">{player().vr.toLocaleString()}</span>
                                        </div>
                                        <Show when={hasLegacyData() && legacyPlayer()}>
                                            {(legacy) => (
                                                <>
                                                    <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                            <Trophy size={14} class="text-amber-500" />
                                                            Legacy Rank:
                                                        </span>
                                                        <span class="font-medium text-amber-600 dark:text-amber-400">#{legacy().rank}</span>
                                                    </div>
                                                    <div class="flex justify-between">
                                                        <span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                            <Trophy size={14} class="text-amber-500" />
                                                            Legacy VR:
                                                        </span>
                                                        <span class="font-medium text-amber-600 dark:text-amber-400">{legacy().vr.toLocaleString()}</span>
                                                    </div>
                                                </>
                                            )}
                                        </Show>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Activity</h3>
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">Last Online:</span>
                                            <span class="font-medium text-gray-900 dark:text-white">{formatLastSeen(player().lastSeen)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <VRHistoryChartComponent friendCode={player().friendCode} />
                        <PlayerRaceStatsCard pid={player().pid} />
                    </div>
                )}
            </Show>
        </div>
    );
}
