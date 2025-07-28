import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { usePlayer } from "../../hooks";
import { formatLastSeen, getVRGainClass } from "../../utils";
import { VRHistoryChartComponent } from "../../components/player";
import {
    MiiComponent,
    VRTierInfo,
    VRTierNumberPlate,
} from "../../components/ui";

export default function PlayerDetailPage() {
    const params = useParams();
    const { playerQuery } = usePlayer(params.friendCode);

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
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex justify-center items-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p class="ml-4 text-gray-600 dark:text-gray-300">
              Loading player data...
                        </p>
                    </div>
                </div>
            </Show>

            {/* Player Data */}
            <Show when={playerQuery.data}>
                {(player) => (
                    <div class="space-y-6">
                        {/* Player Header Card */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                                        <div class="flex items-center space-x-3 mb-2">
                                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                                                {player().name}
                                            </h1>
                                            <Show when={!player().isActive}>
                                                <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                          Inactive
                                                </span>
                                            </Show>
                                            <Show when={player().isSuspicious}>
                                                <span class="bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
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

                                {/* VR Display */}
                                <div class="text-center">
                                    <div class="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        {player().vr.toLocaleString()}
                                    </div>
                                    <div class="text-lg text-gray-600 dark:text-gray-400 font-medium">
                    VR
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VR Tier Progress Card */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                                <div
                                    class={`text-3xl font-bold mb-2 ${getVRGainClass(player().vrStats.last24Hours)}`}
                                >
                                    {player().vrStats.last24Hours >= 0 ? "+" : ""}
                                    {player().vrStats.last24Hours}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 font-medium">
                  Last 24 Hours
                                </div>
                            </div>

                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                                <div
                                    class={`text-3xl font-bold mb-2 ${getVRGainClass(player().vrStats.lastWeek)}`}
                                >
                                    {player().vrStats.lastWeek >= 0 ? "+" : ""}
                                    {player().vrStats.lastWeek}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 font-medium">
                  Last Week
                                </div>
                            </div>

                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                                <div
                                    class={`text-3xl font-bold mb-2 ${getVRGainClass(player().vrStats.lastMonth)}`}
                                >
                                    {player().vrStats.lastMonth >= 0 ? "+" : ""}
                                    {player().vrStats.lastMonth}
                                </div>
                                <div class="text-gray-600 dark:text-gray-400 font-medium">
                  Last Month
                                </div>
                            </div>
                        </div>

                        {/* Player Stats Summary */}
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                                                class={`font-medium ${player().isActive ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
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
