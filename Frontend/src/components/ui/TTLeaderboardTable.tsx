import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftCategoryName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";
import { CountryFlag } from "../common";

interface TTLeaderboardTableProps {
  submissions: GhostSubmission[];
  fastestLapMs: number | null;
  trackLaps: number;
  currentPage: number;
  pageSize: number;
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

    const hasOverallFlap = (submission: GhostSubmission) => {
        if (!props.fastestLapMs) return false;
        return submission.lapSplitsMs.some(lap => lap === props.fastestLapMs);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getValidLaps = (submission: GhostSubmission) => {
        const validLaps: { time: string; timeMs: number; index: number }[] = [];
        
        for (let i = 0; i < Math.min(props.trackLaps, submission.lapSplitsMs.length); i++) {
            if (submission.lapSplitsMs[i] > 0) {
                validLaps.push({
                    time: submission.lapSplitsDisplay[i],
                    timeMs: submission.lapSplitsMs[i],
                    index: i
                });
            }
        }
        
        return validLaps;
    };

    const getDriftInfo = (submission: GhostSubmission) => {
        const driftType = getDriftTypeName(submission.driftType);
        const driftCategory = getDriftCategoryName(submission.driftCategory);
        const categoryShort = driftCategory.replace(" Drift", "");
        return `${driftType} ${categoryShort}`;
    };

    return (
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-blue-600 text-white">
                    <tr>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Rank
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Player
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Time
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                            Fastest Lap
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                            Character
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                            Vehicle
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">
                            Controller
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">
                            Date
                        </th>
                        <th class="px-2 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <For each={props.submissions}>
                        {(submission, index) => {
                            const isExpanded = () => expandedRows().has(submission.id);
                            const holdsFLAP = hasOverallFlap(submission);
                            const validLaps = () => getValidLaps(submission);
                            const actualRank = () => (props.currentPage - 1) * props.pageSize + index() + 1;
              
                            return (
                                <>
                                    {/* Main Row */}
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Rank */}
                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center justify-center sm:justify-start">
                                                <Show when={actualRank() === 1}>
                                                    <span class="text-xl sm:text-2xl">🥇</span>
                                                </Show>
                                                <Show when={actualRank() === 2}>
                                                    <span class="text-xl sm:text-2xl">🥈</span>
                                                </Show>
                                                <Show when={actualRank() === 3}>
                                                    <span class="text-xl sm:text-2xl">🥉</span>
                                                </Show>
                                                <Show when={actualRank() > 3}>
                                                    <span class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                                        {actualRank()}
                                                    </span>
                                                </Show>
                                            </div>
                                        </td>

                                        {/* Player */}
                                        <td class="px-3 sm:px-6 py-4">
                                            <A
                                                href={`/timetrial/player/${submission.ttProfileId}`}
                                                class="block hover:opacity-80 transition-opacity"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="font-medium text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                            {submission.playerName}
                                                        </div>
                                                        <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
                                        <td class="px-3 sm:px-6 py-4">
                                            <div class="flex flex-col gap-1">
                                                <div class="flex items-center gap-1 sm:gap-2">
                                                    <div class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                        {submission.finishTimeDisplay}
                                                    </div>
                                                </div>
                                                <div class="flex gap-1">
                                                    <Show when={submission.shroomless}>
                                                        <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                            🍄
                                                        </span>
                                                    </Show>
                                                    <Show when={submission.glitch}>
                                                        <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                            ⚡
                                                        </span>
                                                    </Show>
                                                </div>
                                                {/* Show FLAP on mobile inline */}
                                                <div class="md:hidden">
                                                    <div class="flex items-center gap-2">
                                                        <span class={`font-mono text-xs font-medium ${
                                                            holdsFLAP 
                                                                ? "text-green-600 dark:text-green-400 font-bold" 
                                                                : "text-gray-600 dark:text-gray-400"
                                                        }`}>
                                                            FL: {submission.fastestLapDisplay}
                                                        </span>
                                                        <Show when={holdsFLAP}>
                                                            <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                                FLAP
                                                            </span>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Fastest Lap */}
                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
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
                                        <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getCharacterName(submission.characterId)}
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getVehicleName(submission.vehicleId)}
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                {getDriftInfo(submission)}
                                            </div>
                                        </td>

                                        {/* Controller */}
                                        <td class="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getControllerName(submission.controllerType)}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                            {formatDate(submission.dateSet)}
                                        </td>

                                        {/* Actions */}
                                        <td class="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                                            <div class="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => toggleRow(submission.id)}
                                                    class="inline-flex items-center p-2 sm:px-3 sm:py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                    aria-label="Toggle details"
                                                >
                                                    <svg 
                                                        class={`w-4 h-4 transition-transform ${isExpanded() ? "rotate-180" : ""}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => props.onDownloadGhost(submission)}
                                                    class="inline-flex items-center p-2 sm:px-3 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                                    aria-label="Download ghost"
                                                >
                                                    <svg class="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    <span class="hidden sm:inline">Ghost</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row - Lap Splits */}
                                    <Show when={isExpanded()}>
                                        <tr class="bg-gray-50 dark:bg-gray-800/50">
                                            <td colspan="9" class="px-3 sm:px-6 py-4">
                                                <div class="max-w-2xl">
                                                    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                                        Lap Times
                                                    </div>
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div class="space-y-2">
                                                            <For each={validLaps()}>
                                                                {(lap) => {
                                                                    const isOverallFlap = props.fastestLapMs !== null && lap.timeMs === props.fastestLapMs;
                                                                    const isFastestInRun = lap.timeMs === Math.min(...validLaps().map(l => l.timeMs));

                                                                    return (
                                                                        <div class="flex items-center justify-between">
                                                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                                                Lap {lap.index + 1}
                                                                            </span>
                                                                            <div class="flex items-center gap-2">
                                                                                <span
                                                                                    class={`font-mono text-sm ${
                                                                                        isOverallFlap
                                                                                            ? "text-green-600 dark:text-green-400 font-black"
                                                                                            : isFastestInRun
                                                                                                ? "text-blue-600 dark:text-blue-400 font-bold"
                                                                                                : "text-gray-700 dark:text-gray-300 font-medium"
                                                                                    }`}
                                                                                >
                                                                                    {lap.time}
                                                                                </span>
                                                                                <Show when={isOverallFlap}>
                                                                                    <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                                                        FLAP
                                                                                    </span>
                                                                                </Show>
                                                                                <Show when={!isOverallFlap && isFastestInRun}>
                                                                                    <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                                                                                        Best
                                                                                    </span>
                                                                                </Show>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }}
                                                            </For>
                                                        </div>

                                                        <div class="space-y-2">
                                                            <div class="space-y-1 text-sm">
                                                                <div class="flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Total Laps:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">{validLaps().length}</span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Average Lap:</span>
                                                                    <span class="font-mono font-medium text-gray-900 dark:text-white">
                                                                        {validLaps().length > 0 
                                                                            ? (() => {
                                                                                const avg = validLaps().reduce((sum, lap) => sum + lap.timeMs, 0) / validLaps().length;
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

                                                            {/* Mobile: Show additional details here */}
                                                            <div class="lg:hidden pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 space-y-1 text-sm">
                                                                <div class="flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Character:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">
                                                                        {getCharacterName(submission.characterId)}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Vehicle:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">
                                                                        {getVehicleName(submission.vehicleId)}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Drift:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">
                                                                        {getDriftInfo(submission)}
                                                                    </span>
                                                                </div>
                                                                <div class="xl:hidden flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Controller:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">
                                                                        {getControllerName(submission.controllerType)}
                                                                    </span>
                                                                </div>
                                                                <div class="xl:hidden flex justify-between">
                                                                    <span class="text-gray-600 dark:text-gray-400">Date Set:</span>
                                                                    <span class="font-medium text-gray-900 dark:text-white">
                                                                        {formatDate(submission.dateSet)}
                                                                    </span>
                                                                </div>
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