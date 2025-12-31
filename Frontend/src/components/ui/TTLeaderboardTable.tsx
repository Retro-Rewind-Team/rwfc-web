import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";
import { CountryFlag } from "../common";
import TTLapSplits from "./TTLapSplits";

interface TTLeaderboardTableProps {
  submissions: GhostSubmission[];
  fastestLapMs: number | null;
  onDownloadGhost: (submission: GhostSubmission) => void;
}

export default function TTLeaderboardTable(props: TTLeaderboardTableProps) {
    const [expandedRows, setExpandedRows] = createSignal<Set<number>>(new Set());

    const toggleRow = (submissionId: number) => {
        const expanded = new Set(expandedRows());
        if (expanded.has(submissionId)) {
            expanded.delete(submissionId);
        } else {
            expanded.add(submissionId);
        }
        setExpandedRows(expanded);
    };

    // Check if this submission has the overall FLAP
    const hasOverallFlap = (submission: GhostSubmission) => {
        if (!props.fastestLapMs) return false;
        return submission.lapSplitsMs.some(lap => lap === props.fastestLapMs);
    };

    return (
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-blue-600 text-white">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Rank
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Player
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Time
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Fastest Lap
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Character
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Vehicle
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Controller
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Date
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
              Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <For each={props.submissions}>
                        {(submission, index) => {
                            const isExpanded = () => expandedRows().has(submission.id);
                            const holdsFLAP = hasOverallFlap(submission);
              
                            return (
                                <>
                                    {/* Main Row */}
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Rank */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <Show when={index() === 0}>
                                                    <span class="text-2xl mr-2">🥇</span>
                                                </Show>
                                                <Show when={index() === 1}>
                                                    <span class="text-2xl mr-2">🥈</span>
                                                </Show>
                                                <Show when={index() === 2}>
                                                    <span class="text-2xl mr-2">🥉</span>
                                                </Show>
                                                <span class="text-lg font-bold text-gray-900 dark:text-white">
                                                    {index() + 1}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Player */}
                                        <td class="px-6 py-4">
                                            <A
                                                href={`/timetrial/player/${submission.ttProfileId}`}
                                                class="block hover:opacity-80 transition-opacity"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <div class="flex-1">
                                                        <div class="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                            {submission.playerName}
                                                        </div>
                                                        <div class="text-sm text-gray-500 dark:text-gray-400">
                                                            {submission.miiName}
                                                        </div>
                                                    </div>
                                                    <CountryFlag 
                                                        countryAlpha2={submission.countryAlpha2}
                                                        countryName={submission.countryName}
                                                        size="md"
                                                    />
                                                </div>
                                            </A>
                                        </td>

                                        {/* Time */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {submission.finishTimeDisplay}
                                            </div>
                                            <div class="flex gap-1 mt-1">
                                                <Show when={submission.shroomless}>
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            🍄 Shroomless
                                                    </span>
                                                </Show>
                                                <Show when={submission.glitch}>
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            ⚡ Glitch
                                                    </span>
                                                </Show>
                                            </div>
                                        </td>

                                        {/* Fastest Lap */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center gap-2">
                                                <span class={`font-mono text-sm font-medium ${
                                                    holdsFLAP 
                                                        ? "text-green-600 dark:text-green-400 font-bold" 
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                    {submission.fastestLapDisplay}
                                                </span>
                                                <Show when={holdsFLAP}>
                                                    <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            FLAP
                                                    </span>
                                                </Show>
                                            </div>
                                        </td>

                                        {/* Character */}
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getCharacterName(submission.characterId)}
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getVehicleName(submission.vehicleId)}
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                {getDriftTypeName(submission.driftType)}
                                            </div>
                                        </td>

                                        {/* Controller */}
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getControllerName(submission.controllerType)}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(submission.dateSet).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td class="px-6 py-4 whitespace-nowrap text-right">
                                            <div class="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleRow(submission.id)}
                                                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <svg 
                                                        class={`w-4 h-4 transition-transform ${isExpanded() ? "rotate-180" : ""}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    <span class="ml-1">Laps</span>
                                                </button>
                                                <button
                                                    onClick={() => props.onDownloadGhost(submission)}
                                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
                                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                          Download
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row - Lap Details */}
                                    <Show when={isExpanded()}>
                                        <tr class="bg-gray-50 dark:bg-gray-800/50">
                                            <td colspan="9" class="px-6 py-4">
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                                                    <Show when={props.fastestLapMs !== null}>
                                                        <TTLapSplits
                                                            lapSplitsDisplay={submission.lapSplitsDisplay}
                                                            fastestLapMs={props.fastestLapMs!}
                                                            lapSplitsMs={submission.lapSplitsMs}
                                                        />
                                                    </Show>
                          
                                                    <div class="space-y-2">
                                                        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Summary
                                                        </div>
                                                        <div class="space-y-1 text-sm">
                                                            <div class="flex justify-between">
                                                                <span class="text-gray-600 dark:text-gray-400">Total Laps:</span>
                                                                <span class="font-medium text-gray-900 dark:text-white">{submission.lapCount}</span>
                                                            </div>
                                                            <div class="flex justify-between">
                                                                <span class="text-gray-600 dark:text-gray-400">Average Lap:</span>
                                                                <span class="font-mono font-medium text-gray-900 dark:text-white">
                                                                    {submission.lapSplitsMs.length > 0 
                                                                        ? (() => {
                                                                            const avg = submission.lapSplitsMs.reduce((a, b) => a + b, 0) / submission.lapSplitsMs.length;
                                                                            const mins = Math.floor(avg / 60000);
                                                                            const secs = ((avg % 60000) / 1000).toFixed(3);
                                                                            return `${mins}:${secs.padStart(6, "0")}`;
                                                                        })()
                                                                        : "N/A"
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div class="flex justify-between">
                                                                <span class="text-gray-600 dark:text-gray-400">Fastest Lap:</span>
                                                                <span class="font-mono font-medium text-green-600 dark:text-green-400">
                                                                    {submission.fastestLapDisplay}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </Show>
                                </>
                            );
                        }}
                    </For>
                </tbody>
            </table>
        </div>
    );
}