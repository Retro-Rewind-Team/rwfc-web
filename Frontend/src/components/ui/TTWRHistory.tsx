import { For, Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getControllerName, getDriftCategoryName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";
import { CountryFlag, LoadingSpinner } from "../common";

interface TTWRHistoryProps {
    history: GhostSubmission[] | null | undefined;
    isLoading: boolean;
    isError: boolean;
    onDownloadGhost: (submission: GhostSubmission) => void;
    title?: string;
    subtitle?: string;
    isFlap?: boolean;
}

export default function TTWRHistory(props: TTWRHistoryProps) {
    const title = () => props.title ?? "World Record History";
    const subtitle = () => props.subtitle ?? "Track the progression of world records over time";
    const isFlap = () => props.isFlap ?? false;

    // Returns the relevant comparison time for a submission depending on mode
    const getComparisonTime = (submission: GhostSubmission) =>
        isFlap() ? submission.fastestLapMs : submission.finishTimeMs;

    const getTimeDisplay = (submission: GhostSubmission) =>
        isFlap() ? submission.fastestLapDisplay : submission.finishTimeDisplay;

    const formatTimeImprovement = (currentMs: number, previousMs: number) => {
        if (currentMs === previousMs) return null; // tied 
        const diffMs = previousMs - currentMs;
        const seconds = Math.floor(diffMs / 1000);
        const ms = diffMs % 1000;
        if (seconds > 0) {
            return `-${seconds}.${ms.toString().padStart(3, "0")}s`;
        }
        return `-${ms}ms`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getDriftInfo = (submission: GhostSubmission) => {
        const driftType = getDriftTypeName(submission.driftType);
        const driftCategory = getDriftCategoryName(submission.driftCategory);
        return `${driftType} ${driftCategory.replace(" Drift", "")}`;
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class={`px-4 sm:px-6 py-4 bg-gradient-to-r ${
                isFlap()
                    ? "from-orange-500 to-amber-500"
                    : "from-amber-500 to-orange-600"
            }`}>
                <h3 class="text-xl sm:text-2xl font-bold text-white">{title()}</h3>
                <p class="text-xs sm:text-sm text-white/80">{subtitle()}</p>
            </div>

            <Show when={props.isLoading}>
                <div class="p-12 text-center">
                    <LoadingSpinner />
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading history...</p>
                </div>
            </Show>

            <Show when={props.isError}>
                <div class="p-6 text-center text-red-600 dark:text-red-400">
                    Failed to load world record history
                </div>
            </Show>

            <Show when={props.history && !props.isLoading}>
                <Show
                    when={props.history!.length > 0}
                    fallback={
                        <div class="p-12 text-center">
                            <div class="text-6xl mb-4">{isFlap() ? "⚡" : "🏁"}</div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No History Yet</h3>
                            <p class="text-gray-600 dark:text-gray-400">
                                {isFlap()
                                    ? "Flap records will appear here as they're set"
                                    : "World records will appear here as they're set"
                                }
                            </p>
                        </div>
                    }
                >
                    <div class="p-3 sm:p-6">
                        <div class="relative">
                            {/* Timeline line */}
                            <div class="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-orange-500 to-red-600" />

                            <div class="space-y-6 sm:space-y-8">
                                <For each={props.history!}>
                                    {(record, index) => {
                                        const isLatest = index() === props.history!.length - 1;
                                        const previousRecord = index() > 0 ? props.history![index() - 1] : null;
                                        const currentTime = getComparisonTime(record);
                                        const previousTime = previousRecord ? getComparisonTime(previousRecord) : null;
                                        const isTied = previousTime !== null && currentTime === previousTime;
                                        const improvement = previousTime !== null && !isTied
                                            ? formatTimeImprovement(currentTime, previousTime)
                                            : null;

                                        return (
                                            <div class="relative pl-12 sm:pl-16">
                                                {/* Timeline dot */}
                                                <div class={`absolute left-4 sm:left-6 top-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-4 ${
                                                    isLatest
                                                        ? "bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50 animate-pulse"
                                                        : isTied
                                                            ? "bg-gray-400 border-gray-300"
                                                            : "bg-amber-500 border-amber-400"
                                                }`} />

                                                {/* Record card */}
                                                <div class={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 border-2 transition-all hover:shadow-lg ${
                                                    isLatest
                                                        ? "border-yellow-400 shadow-md"
                                                        : isTied
                                                            ? "border-gray-300 dark:border-gray-500"
                                                            : "border-gray-200 dark:border-gray-600"
                                                }`}>
                                                    {/* Header */}
                                                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                                        <div class="flex-1 min-w-0">
                                                            <div class="flex flex-wrap items-center gap-2">
                                                                <Show when={isLatest}>
                                                                    <span class="text-xl sm:text-2xl">🏆</span>
                                                                </Show>
                                                                <div class={`text-2xl sm:text-3xl font-black ${
                                                                    isLatest
                                                                        ? "text-yellow-600 dark:text-yellow-400"
                                                                        : "text-gray-900 dark:text-white"
                                                                }`}>
                                                                    {getTimeDisplay(record)}
                                                                </div>

                                                                <Show when={!previousRecord}>
                                                                    <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md whitespace-nowrap">
                                                                        FIRST RECORD
                                                                    </span>
                                                                </Show>
                                                                <Show when={isTied}>
                                                                    <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                                        <span class="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                                                                            = Tied
                                                                        </span>
                                                                    </div>
                                                                </Show>
                                                                <Show when={improvement !== null}>
                                                                    <div class="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                                                                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        </svg>
                                                                        <span class="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                                                            {improvement}
                                                                        </span>
                                                                    </div>
                                                                </Show>
                                                            </div>

                                                            {/* Secondary time in flap mode */}
                                                            <Show when={isFlap()}>
                                                                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    Finish: {record.finishTimeDisplay}
                                                                </div>
                                                            </Show>

                                                            <Show when={isLatest}>
                                                                <div class={`mt-1 text-xs sm:text-sm font-semibold ${
                                                                    isFlap()
                                                                        ? "text-orange-500 dark:text-orange-400"
                                                                        : "text-yellow-600 dark:text-yellow-400"
                                                                }`}>
                                                                    {isFlap() ? "Current Flap Record" : "Current World Record"}
                                                                </div>
                                                            </Show>
                                                        </div>

                                                        {/* Badges */}
                                                        <div class="flex flex-wrap gap-1">
                                                            <Show when={record.shroomless}>
                                                                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 whitespace-nowrap">
                                                                    🍄 <span class="hidden sm:inline ml-1">Shroomless</span>
                                                                </span>
                                                            </Show>
                                                            <Show when={record.glitch}>
                                                                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 whitespace-nowrap">
                                                                    ⚡ <span class="hidden sm:inline ml-1">Glitch/Shortcut</span>
                                                                </span>
                                                            </Show>
                                                        </div>
                                                    </div>

                                                    {/* Player and Setup */}
                                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3">
                                                        <div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Player</div>
                                                            <div class="flex items-center gap-2">
                                                                <div class="flex-1 min-w-0">
                                                                    <div class="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                                                        {record.playerName}
                                                                    </div>
                                                                    <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                        {record.miiName}
                                                                    </div>
                                                                </div>
                                                                <CountryFlag
                                                                    countryAlpha2={record.countryAlpha2}
                                                                    countryName={record.countryName}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Setup</div>
                                                            <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                                {getCharacterName(record.characterId)}
                                                            </div>
                                                            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                                {getVehicleName(record.vehicleId)} • {getDriftInfo(record)}
                                                            </div>
                                                            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                                {getControllerName(record.controllerType)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Date and Download */}
                                                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                            <span class="font-medium">Set on:</span>{" "}
                                                            {formatDate(record.dateSet)}
                                                        </div>
                                                        <button
                                                            onClick={() => props.onDownloadGhost(record)}
                                                            class="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full sm:w-auto"
                                                        >
                                                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download Ghost
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <Show when={props.history!.length > 1}>
                            <div class="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                                    <div>
                                        <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {props.history!.length}
                                        </div>
                                        <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total</div>
                                    </div>
                                    <div>
                                        <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {new Set(props.history!.map((r) => r.playerName)).size}
                                        </div>
                                        <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Players</div>
                                    </div>
                                    <div>
                                        <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {getTimeDisplay(props.history![0])}
                                        </div>
                                        <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">First</div>
                                    </div>
                                    <div>
                                        {/* Total delta */}
                                        <Show
                                            when={
                                                getComparisonTime(props.history![0]) !==
                                                getComparisonTime(props.history![props.history!.length - 1])
                                            }
                                            fallback={
                                                <>
                                                    <div class="text-xl sm:text-2xl font-bold text-gray-500 dark:text-gray-400">= Tied</div>
                                                    <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Δ</div>
                                                </>
                                            }
                                        >
                                            <div class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                                {formatTimeImprovement(
                                                    getComparisonTime(props.history![props.history!.length - 1]),
                                                    getComparisonTime(props.history![0])
                                                )}
                                            </div>
                                            <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Δ</div>
                                        </Show>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </div>
                </Show>
            </Show>
        </div>
    );
}
