import { For, Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";

interface TTPlayerSubmissionsTableProps {
  submissions: GhostSubmission[];
  onDownloadGhost: (submissionId: number) => void;
}

export default function TTPlayerSubmissionsTable(props: TTPlayerSubmissionsTableProps) {
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
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Fastest Lap
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                            Ghost
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <For each={props.submissions}>
                        {(submission) => (
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                {/* Track */}
                                <td class="px-6 py-4">
                                    <div class="font-medium text-gray-900 dark:text-white">
                                        {submission.trackName}
                                    </div>
                                </td>

                                {/* CC */}
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span
                                        class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            submission.cc === 150
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        }`}
                                    >
                                        {submission.cc}cc
                                    </span>
                                </td>

                                {/* Time */}
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {submission.finishTimeDisplay}
                                    </div>
                                    <div class="flex gap-1 mt-1">
                                        <Show when={submission.shroomless}>
                                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                🍄
                                            </span>
                                        </Show>
                                        <Show when={submission.glitch}>
                                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                ⚡
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
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                </td>

                                {/* Fastest Lap */}
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-mono text-sm font-medium text-green-600 dark:text-green-400">
                                        {submission.fastestLapDisplay}
                                    </div>
                                </td>

                                {/* Download */}
                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => props.onDownloadGhost(submission.id)}
                                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                </td>
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div>
    );
}