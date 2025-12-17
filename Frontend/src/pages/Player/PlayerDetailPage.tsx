import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { usePlayer } from "../../hooks";
import { formatLastSeen } from "../../utils";
import { VRHistoryChartComponent, VRStatsCard } from "../../components/ui";
import {
    MiiComponent,
    VRTierInfo,
    VRTierNumberPlate,
} from "../../components/ui";

export default function PlayerDetailPage() {
    const params = useParams();
    const { 
        playerQuery, 
        legacyPlayer, 
        hasLegacyData,
        isPlayerNotFound, // Now from hook
    } = usePlayer(params.friendCode);

    return (
        <div class="space-y-6">
            {/* Back Button */}
            <div>
                <A
                    href="/vr"
                    class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    <span>Back to Leaderboard</span>
                </A>
            </div>

            {/* Loading State */}
            <Show when={playerQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex justify-center items-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p class="ml-4 text-gray-600 dark:text-gray-300">
                            Loading player data...
                        </p>
                    </div>
                </div>
            </Show>

            {/* Player Not Found State */}
            <Show when={isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">❌</div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Player Not Found
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">
                            No player found with friend code:{" "}
                            <code class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {params.friendCode}
                            </code>
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-500">
                            This player might not have registered on Retro WFC yet, or the friend code may be incorrect.
                        </p>
                        <div class="pt-4">
                            <A
                                href="/vr"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center"
                            >
                                <svg
                                    class="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Browse Leaderboard
                            </A>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Error State (non-404 errors) */}
            <Show when={playerQuery.isError && !isPlayerNotFound()}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center space-y-4">
                        <div class="text-6xl">⚠️</div>
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
                                    {/* Mii Image and VR Tier Number Plate */}
                                    <div class="flex flex-col items-center">
                                        <MiiComponent
                                            playerName={player().name}
                                            friendCode={player().friendCode}
                                            size="lg"
                                            className="mb-3"
                                        />
                                        <VRTierNumberPlate
                                            rank={player().rank}
                                            vr={player().vr}
                                            isSuspicious={player().isSuspicious}
                                            size="lg"
                                        />
                                    </div>

                                    {/* Player Info */}
                                    <div>
                                        <div class="flex flex-wrap items-center gap-3 mb-2">
                                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                                                {player().name}
                                            </h1>
                                            <Show when={!player().isActive}>
                                                <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                                                    Inactive
                                                </span>
                                            </Show>
                                            <Show when={player().isSuspicious}>
                                                <span class="bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                                                    ⚠️ Suspicious
                                                </span>
                                            </Show>
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
                                            <Show when={player().activeRank}>
                                                <p>
                                                    <span class="font-medium">Active Rank:</span> #
                                                    {player().activeRank}
                                                </p>
                                            </Show>
                                        </div>
                                    </div>
                                </div>

                                {/* VR Display - Current and Legacy */}
                                <div class="text-center">
                                    <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        {player().vr.toLocaleString()}
                                    </div>
                                    <div class="text-lg text-gray-600 dark:text-gray-400 font-medium mb-3">
                                        Current VR
                                    </div>
                                    
                                    {/* Legacy VR Display */}
                                    <Show when={hasLegacyData() && legacyPlayer()}>
                                        {(legacy) => (
                                            <div class="pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                                                <div class="flex items-center justify-center gap-2 mb-1">
                                                    <span class="text-xl">🏆</span>
                                                    <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                        {legacy().vr.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div class="text-sm text-gray-500 dark:text-gray-500 font-medium">
                                                    Legacy VR (#{legacy().rank})
                                                </div>
                                            </div>
                                        )}
                                    </Show>
                                </div>
                            </div>
                        </div>

                        {/* VR Tier Progress Card */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                🏁 VR Tier Progress
                            </h2>
                            <VRTierInfo
                                vr={player().vr}
                                isSuspicious={player().isSuspicious}
                                showProgress={true}
                            />
                        </div>

                        {/* VR Stats Cards */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <VRStatsCard 
                                value={player().vrStats.last24Hours} 
                                label="Last 24 Hours" 
                            />
                            <VRStatsCard 
                                value={player().vrStats.lastWeek} 
                                label="Last Week" 
                            />
                            <VRStatsCard 
                                value={player().vrStats.lastMonth} 
                                label="Last Month" 
                            />
                        </div>

                        {/* Player Stats Summary */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                📊 Player Summary
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Rankings
                                    </h3>
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">
                                                Overall Rank:
                                            </span>
                                            <span class="font-medium text-gray-900 dark:text-white">
                                                #{player().rank}
                                            </span>
                                        </div>
                                        <Show when={player().activeRank}>
                                            <div class="flex justify-between">
                                                <span class="text-gray-600 dark:text-gray-400">
                                                    Active Rank:
                                                </span>
                                                <span class="font-medium text-gray-900 dark:text-white">
                                                    #{player().activeRank}
                                                </span>
                                            </div>
                                        </Show>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">
                                                Current VR:
                                            </span>
                                            <span class="font-medium text-gray-900 dark:text-white">
                                                {player().vr.toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        {/* Legacy Rank in Summary */}
                                        <Show when={hasLegacyData() && legacyPlayer()}>
                                            {(legacy) => (
                                                <>
                                                    <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <span class="text-gray-600 dark:text-gray-400">
                                                            🏆 Legacy Rank:
                                                        </span>
                                                        <span class="font-medium text-amber-600 dark:text-amber-400">
                                                            #{legacy().rank}
                                                        </span>
                                                    </div>
                                                    <div class="flex justify-between">
                                                        <span class="text-gray-600 dark:text-gray-400">
                                                            🏆 Legacy VR:
                                                        </span>
                                                        <span class="font-medium text-amber-600 dark:text-amber-400">
                                                            {legacy().vr.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </Show>
                                    </div>
                                </div>

                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Status
                                    </h3>
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">
                                                Status:
                                            </span>
                                            <span
                                                class={`font-medium ${player().isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}
                                            >
                                                {player().isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600 dark:text-gray-400">
                                                Last Online:
                                            </span>
                                            <span class="font-medium text-gray-900 dark:text-white">
                                                {formatLastSeen(player().lastSeen)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VR History Chart */}
                        <VRHistoryChartComponent friendCode={player().friendCode} />
                    </div>
                )}
            </Show>
        </div>
    );
}