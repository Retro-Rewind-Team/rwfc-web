import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { ChevronDown, Medal, Trophy, Zap } from "lucide-solid";
import GhostDownloadButton from "./GhostDownloadButton";
import { GhostSubmission } from "../../../types/timeTrial";
import {
    getCharacterName,
    getControllerName,
    getVehicleName,
} from "../../../constants/marioKartMappings";
import { formatAverageLap, formatDate, getDriftInfo } from "../../../utils/formatter";
import { CountryFlag } from "../../common";

interface TTLeaderboardTableProps {
    submissions: GhostSubmission[];
    fastestLapMs: number | null;
    trackLaps: number;
    isFlap: boolean;
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

    // Only used in flap mode - highlights the submission holding the best flap
    const hasOverallFlap = (submission: GhostSubmission) => {
        if (!props.isFlap || !props.fastestLapMs) return false;
        return submission.lapSplitsMs.some((lap) => lap === props.fastestLapMs);
    };

    const getValidLaps = (submission: GhostSubmission) => {
        const validLaps: { time: string; timeMs: number; index: number }[] = [];
        for (let i = 0; i < Math.min(props.trackLaps, submission.lapSplitsMs.length); i++) {
            if (submission.lapSplitsMs[i] > 0) {
                validLaps.push({
                    time: submission.lapSplitsDisplay[i],
                    timeMs: submission.lapSplitsMs[i],
                    index: i,
                });
            }
        }
        return validLaps;
    };

    const getRankDisplay = (rank: number | null) => {
        if (rank === 1) return <Trophy size={22} class="text-yellow-500" />;
        if (rank === 2) return <Medal size={22} class="text-gray-400" />;
        if (rank === 3) return <Medal size={22} class="text-amber-600" />;
        return <span class="text-base sm:text-lg font-semibold text-fg">{rank ?? "-"}</span>;
    };

    const primaryTimeDisplay = (submission: GhostSubmission) =>
        props.isFlap ? submission.fastestLapDisplay : submission.finishTimeDisplay;

    return (
        <div class="relative overflow-x-auto">
            {/* Rank and player stay put while the rest scrolls sideways on a phone. The rank column
                has a fixed width so the player column can pin right beside it. */}
            <table class="w-full [--pin-width:3.5rem] sm:[--pin-width:5.5rem]">
                <thead class="bg-surface border-b border-line">
                    <tr>
                        <th class="pin-start w-14 max-w-14 min-w-14 px-3 py-3 text-left text-xs font-medium text-gray-700 sm:w-22 sm:max-w-22 sm:min-w-22 sm:px-6 dark:text-gray-200">
                            Rank
                        </th>
                        <th class="pin-start-2 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                            Player
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                            {props.isFlap ? "Fastest Lap" : "Time"}
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hidden md:table-cell">
                            {props.isFlap ? "Finish Time" : "Fastest Lap"}
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hidden lg:table-cell">
                            Character
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hidden lg:table-cell">
                            Vehicle
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hidden xl:table-cell">
                            Controller
                        </th>
                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hidden xl:table-cell">
                            Date
                        </th>
                        <th class="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-200">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-line">
                    <For each={props.submissions}>
                        {(submission) => {
                            const isExpanded = () => expandedRows().has(submission.id);
                            // holdsFLAP is only meaningful in flap mode
                            const holdsFLAP = hasOverallFlap(submission);
                            const validLaps = () => getValidLaps(submission);

                            return (
                                <>
                                    <tr class="hover:bg-surface transition-colors">
                                        {/* Rank */}
                                        <td class="pin-start w-14 max-w-14 min-w-14 px-3 py-4 whitespace-nowrap sm:w-22 sm:max-w-22 sm:min-w-22 sm:px-6">
                                            <div class="flex items-center justify-center sm:justify-start">
                                                {getRankDisplay(submission.rank)}
                                            </div>
                                        </td>

                                        {/* Player */}
                                        <td class="pin-start-2 px-3 sm:px-6 py-4">
                                            <A
                                                href={`/timetrial/player/${submission.ttProfileId}`}
                                                class="block hover:opacity-80 transition-opacity"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <div class="min-w-0">
                                                        <div class="font-medium text-sm sm:text-base text-fg hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                                                            {submission.playerName}
                                                        </div>
                                                        <div class="text-xs sm:text-sm text-fg-subtle">
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

                                        {/* Primary time */}
                                        <td class="px-3 sm:px-6 py-4">
                                            <div class="flex flex-col gap-1">
                                                <div
                                                    class={`text-base sm:text-lg font-semibold whitespace-nowrap ${
                                                        props.isFlap
                                                            ? "text-orange-500 dark:text-orange-400"
                                                            : "text-blue-600 dark:text-blue-400"
                                                    }`}
                                                >
                                                    {primaryTimeDisplay(submission)}
                                                </div>
                                                <div class="flex gap-1">
                                                    <Show when={submission.shroomless}>
                                                        <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                            Shroomless
                                                        </span>
                                                    </Show>
                                                    <Show when={submission.glitch}>
                                                        <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                            <Zap size={10} />
                                                        </span>
                                                    </Show>
                                                </div>
                                                {/* Secondary time inline on mobile */}
                                                <div class="md:hidden">
                                                    <Show when={props.isFlap}>
                                                        <span class="font-mono text-xs font-medium text-fg-subtle">
                                                            Finish: {submission.finishTimeDisplay}
                                                        </span>
                                                    </Show>
                                                    <Show when={!props.isFlap}>
                                                        <span class="font-mono text-xs font-medium text-fg-subtle">
                                                            FL: {submission.fastestLapDisplay}
                                                        </span>
                                                    </Show>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Secondary time - desktop */}
                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <Show when={props.isFlap}>
                                                {/* In flap mode: show finish time, highlight rank 1 */}
                                                <div class="flex items-center gap-2">
                                                    <span
                                                        class={`font-mono text-sm font-medium ${
                                                            holdsFLAP
                                                                ? "text-orange-500 dark:text-orange-400 font-semibold"
                                                                : "text-gray-300"
                                                        }`}
                                                    >
                                                        {submission.finishTimeDisplay}
                                                    </span>
                                                    <Show when={holdsFLAP}>
                                                        <span class="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                                                            FLAP
                                                        </span>
                                                    </Show>
                                                </div>
                                            </Show>
                                            <Show when={!props.isFlap}>
                                                {/* In regular mode: just show fastest lap, no badge */}
                                                <span class="font-mono text-sm font-medium text-fg-muted">
                                                    {submission.fastestLapDisplay}
                                                </span>
                                            </Show>
                                        </td>

                                        {/* Character */}
                                        <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                            <div class="text-sm text-fg">
                                                {getCharacterName(submission.characterId)}
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                            <div class="text-sm text-fg">
                                                {getVehicleName(submission.vehicleId)}
                                            </div>
                                            <div class="text-xs text-fg-subtle">
                                                {getDriftInfo(
                                                    submission.driftType,
                                                    submission.driftCategory,
                                                )}
                                            </div>
                                        </td>

                                        {/* Controller */}
                                        <td class="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                            <div class="text-sm text-fg">
                                                {getControllerName(submission.controllerType)}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden xl:table-cell">
                                            {formatDate(submission.dateSet)}
                                        </td>

                                        {/* Actions */}
                                        <td class="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                                            <div class="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRow(submission.id)}
                                                    class="inline-flex items-center p-2 sm:px-3 sm:py-1.5 border border-line-strong text-xs font-medium rounded-md text-fg-muted bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                                    aria-label="Toggle details"
                                                    aria-expanded={isExpanded()}
                                                    aria-controls={`submission-${submission.id}-laps`}
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        class={`transition-transform ${isExpanded() ? "rotate-180" : ""}`}
                                                    />
                                                </button>
                                                <GhostDownloadButton
                                                    available={submission.hasGhostFile}
                                                    submissionId={submission.id}
                                                    onDownload={() =>
                                                        props.onDownloadGhost(submission)
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row */}
                                    <Show when={isExpanded()}>
                                        <tr
                                            id={`submission-${submission.id}-laps`}
                                            class="bg-surface"
                                        >
                                            <td colspan="9" class="px-3 sm:px-6 py-4">
                                                <div class="max-w-2xl">
                                                    <div class="text-xs font-semibold text-fg-subtle mb-3">
                                                        Lap Times
                                                    </div>
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div class="space-y-2">
                                                            <For each={validLaps()}>
                                                                {(lap) => {
                                                                    // In flap mode: green = overall best flap, blue = best in this run
                                                                    // In regular mode: just blue = best in this run, no green FLAP highlight
                                                                    const isOverallFlap =
                                                                        props.isFlap &&
                                                                        props.fastestLapMs !==
                                                                            null &&
                                                                        lap.timeMs ===
                                                                            props.fastestLapMs;
                                                                    const isFastestInRun =
                                                                        lap.timeMs ===
                                                                        Math.min(
                                                                            ...validLaps().map(
                                                                                (l) => l.timeMs,
                                                                            ),
                                                                        );
                                                                    return (
                                                                        <div class="flex items-center justify-between">
                                                                            <span class="text-sm text-fg-subtle">
                                                                                Lap {lap.index + 1}
                                                                            </span>
                                                                            <div class="flex items-center gap-2">
                                                                                <span
                                                                                    class={`font-mono text-sm ${
                                                                                        isOverallFlap
                                                                                            ? "text-green-600 dark:text-green-400 font-black"
                                                                                            : isFastestInRun
                                                                                              ? "text-blue-600 dark:text-blue-400 font-semibold"
                                                                                              : "text-fg-muted font-medium"
                                                                                    }`}
                                                                                >
                                                                                    {lap.time}
                                                                                </span>
                                                                                <Show
                                                                                    when={
                                                                                        isOverallFlap
                                                                                    }
                                                                                >
                                                                                    <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold">
                                                                                        FLAP
                                                                                    </span>
                                                                                </Show>
                                                                                <Show
                                                                                    when={
                                                                                        !isOverallFlap &&
                                                                                        isFastestInRun
                                                                                    }
                                                                                >
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
                                                                    <span class="text-fg-subtle">
                                                                        Total Laps:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {validLaps().length}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Average Lap:
                                                                    </span>
                                                                    <span class="font-mono font-medium text-fg">
                                                                        {formatAverageLap(
                                                                            validLaps(),
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Fastest Lap:
                                                                    </span>
                                                                    <span class="font-mono font-medium text-green-600 dark:text-green-400">
                                                                        {
                                                                            submission.fastestLapDisplay
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <Show when={props.isFlap}>
                                                                    <div class="flex justify-between">
                                                                        <span class="text-fg-subtle">
                                                                            Finish Time:
                                                                        </span>
                                                                        <span class="font-mono font-medium text-fg">
                                                                            {
                                                                                submission.finishTimeDisplay
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </Show>
                                                            </div>
                                                            <div class="lg:hidden pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 space-y-1 text-sm">
                                                                <div class="flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Character:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {getCharacterName(
                                                                            submission.characterId,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Vehicle:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {getVehicleName(
                                                                            submission.vehicleId,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Drift:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {getDriftInfo(
                                                                            submission.driftType,
                                                                            submission.driftCategory,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="xl:hidden flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Controller:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {getControllerName(
                                                                            submission.controllerType,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="xl:hidden flex justify-between">
                                                                    <span class="text-fg-subtle">
                                                                        Date Set:
                                                                    </span>
                                                                    <span class="font-medium text-fg">
                                                                        {formatDate(
                                                                            submission.dateSet,
                                                                        )}
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
