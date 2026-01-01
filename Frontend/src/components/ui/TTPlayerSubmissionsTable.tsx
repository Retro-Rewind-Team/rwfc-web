import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";

interface TTPlayerSubmissionsTableProps {
  submissions: GhostSubmission[];
  onDownloadGhost: (submission: GhostSubmission) => void;
}

export default function TTPlayerSubmissionsTable(props: TTPlayerSubmissionsTableProps) {
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

    // Format date as DD/MM/YYYY
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get only valid laps (filter out 0:00.000)
    const getValidLaps = (submission: GhostSubmission) => {
        const validLaps: { time: string; timeMs: number; index: number }[] = [];
        
        for (let i = 0; i < submission.lapSplitsMs.length; i++) {
            // Only include non-zero laps
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

    return (
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-blue-600 text-white">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Track
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            CC
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Time
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Fastest Lap
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                            Character
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                            Vehicle
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                            Controller
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                            Date
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <For each={props.submissions}>
                        {(submission) => {
                            const isExpanded = () => expandedRows().has(submission.id);
                            const validLaps = () => getValidLaps(submission);

                            return (
                                <>
                                    {/* Main Row */}
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Track Name */}
                                        <td class="px-6 py-4">
                                            <A
                                                href={`/timetrial/${submission.cc}cc/${submission.trackId}`}
                                                class="block hover:opacity-80 transition-opacity"
                                            >
                                                <div class="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                    {submission.trackName}
                                                </div>
                                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                                    {submission.lapCount} lap{submission.lapCount !== 1 ? "s" : ""}
                                                </div>
                                            </A>
                                        </td>

                                        {/* CC */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    submission.cc === 150
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                                                }`}
                                            >
                                                {submission.cc}cc
                                            </span>
                                        </td>

                                        {/* Time */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center gap-2">
                                                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {submission.finishTimeDisplay}
                                                </div>
                                                <div class="flex flex-col gap-1">
                                                    <Show when={submission.shroomless}>
                                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                            🍄
                                                        </span>
                                                    </Show>
                                                    <Show when={submission.glitch}>
                                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                            ⚡
                                                        </span>
                                                    </Show>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Fastest Lap */}
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {submission.fastestLapDisplay}
                                            </span>
                                        </td>

                                        {/* Character */}
                                        <td class="px-6 py-4 hidden md:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getCharacterName(submission.characterId)}
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td class="px-6 py-4 hidden md:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getVehicleName(submission.vehicleId)}
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                {getDriftTypeName(submission.driftType)}
                                            </div>
                                        </td>

                                        {/* Controller */}
                                        <td class="px-6 py-4 hidden lg:table-cell">
                                            <div class="text-sm text-gray-900 dark:text-white">
                                                {getControllerName(submission.controllerType)}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                            {formatDate(submission.dateSet)}
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
                                                </button>
                                                <button
                                                    onClick={() => props.onDownloadGhost(submission)}
                                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                                >
                                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Ghost
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row - Lap Splits */}
                                    <Show when={isExpanded()}>
                                        <tr class="bg-gray-50 dark:bg-gray-800/50">
                                            <td colspan="9" class="px-6 py-4">
                                                <div class="max-w-2xl">
                                                    <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                                        Lap Times
                                                    </div>
                                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div class="space-y-2">
                                                            <For each={validLaps()}>
                                                                {(lap) => {
                                                                    const isFastestInRun = lap.timeMs === Math.min(...validLaps().map(l => l.timeMs));

                                                                    return (
                                                                        <div class="flex items-center justify-between">
                                                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                                                Lap {lap.index + 1}
                                                                            </span>
                                                                            <div class="flex items-center gap-2">
                                                                                <span
                                                                                    class={`font-mono text-sm ${
                                                                                        isFastestInRun
                                                                                            ? "text-blue-600 dark:text-blue-400 font-bold"
                                                                                            : "text-gray-700 dark:text-gray-300 font-medium"
                                                                                    }`}
                                                                                >
                                                                                    {lap.time}
                                                                                </span>
                                                                                <Show when={isFastestInRun}>
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