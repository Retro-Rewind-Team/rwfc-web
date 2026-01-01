import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useTTTrackBrowser } from "../../hooks/useTTTrackBrowser";
import { LoadingSpinner } from "../../components/common";
import { CountryFlag } from "../../components/common";
import { getCharacterName, getControllerName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";

export default function TTLeaderboardPage() {
    const browser = useTTTrackBrowser();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div class="space-y-8">
            {/* Hero Header Section */}
            <section class="py-12">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                        Time Trial Leaderboards
                    </h1>
                    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Browse world records for all Retro Rewind tracks
                    </p>
                </div>
            </section>

            {/* Filters */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                    <div class="flex items-center">
                        <span class="text-3xl mr-3">🏁</span>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Browse Tracks
                        </h2>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Track Category
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => browser.handleCategoryChange("retro")}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    browser.selectedCategory() === "retro"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Retro Tracks
                            </button>
                            <button
                                onClick={() => browser.handleCategoryChange("custom")}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    browser.selectedCategory() === "custom"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Custom Tracks
                            </button>
                        </div>
                    </div>

                    {/* CC Selection */}
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Engine Class
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => browser.handleCCChange(150)}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    browser.selectedCC() === 150
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                150cc
                            </button>
                            <button
                                onClick={() => browser.handleCCChange(200)}
                                class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                    browser.selectedCC() === 200
                                        ? "bg-sky-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                200cc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div class="mt-4">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Search Tracks
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by track name..."
                            value={browser.searchQuery()}
                            onInput={(e) => browser.handleSearchInput(e.target.value)}
                            class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            <Show when={browser.tracksQuery.isLoading || browser.worldRecordsQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <LoadingSpinner />
                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                        {browser.tracksQuery.isLoading ? "Loading tracks..." : "Loading world records..."}
                    </p>
                </div>
            </Show>

            {/* Error State */}
            <Show when={browser.tracksQuery.isError || browser.worldRecordsQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h3 class="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                            {browser.tracksQuery.isError ? "Failed to load tracks" : "Failed to load world records"}
                        </h3>
                        <button
                            onClick={() => {
                                if (browser.tracksQuery.isError) {
                                    browser.tracksQuery.refetch();
                                } else {
                                    browser.worldRecordsQuery.refetch();
                                }
                            }}
                            class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Tracks Table */}
            <Show when={browser.tracksQuery.data && browser.worldRecordsQuery.data && !browser.tracksQuery.isLoading && !browser.worldRecordsQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="bg-blue-600 px-6 py-4">
                        <h2 class="text-2xl font-bold text-white">
                            {browser.selectedCategory() === "retro" ? "Retro Tracks" : "Custom Tracks"}
                        </h2>
                        <p class="text-blue-100 text-sm">
                            {browser.filteredTracks().length} track{browser.filteredTracks().length !== 1 ? "s" : ""} • {browser.selectedCC()}cc Records
                        </p>
                    </div>

                    <Show
                        when={browser.filteredTracks().length > 0}
                        fallback={
                            <div class="p-12 text-center">
                                <div class="text-6xl mb-4">🔍</div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    No tracks found
                                </h3>
                                <p class="text-gray-600 dark:text-gray-400">
                                    Try adjusting your search
                                </p>
                            </div>
                        }
                    >
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-blue-600 text-white">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Track
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            World Record
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Record Holder
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                                            Character
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                                            Vehicle
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">
                                            Controller
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">
                                            Date Set
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <For each={browser.filteredTracks()}>
                                        {(track) => {
                                            const wr = () => browser.getWorldRecordForTrack(track.id);

                                            return (
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    {/* Track Name */}
                                                    <td class="px-6 py-4">
                                                        <A
                                                            href={`/timetrial/${browser.selectedCC()}cc/${track.id}`}
                                                            class="block hover:opacity-80 transition-opacity"
                                                        >
                                                            <div class="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                                {track.name}
                                                            </div>
                                                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                                                {track.laps} lap{track.laps !== 1 ? "s" : ""}
                                                            </div>
                                                        </A>
                                                    </td>

                                                    {/* World Record Time */}
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <Show
                                                            when={wr()}
                                                            fallback={
                                                                <span class="text-gray-400 dark:text-gray-500 italic">No record yet</span>
                                                            }
                                                        >
                                                            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                                {wr()!.finishTimeDisplay}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Record Holder */}
                                                    <td class="px-6 py-4">
                                                        <Show when={wr()}>
                                                            <A
                                                                href={`/timetrial/player/${wr()!.ttProfileId}`}
                                                                class="block hover:opacity-80 transition-opacity"
                                                            >
                                                                <div class="flex items-center gap-2">
                                                                    <div>
                                                                        <div class="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                                            {wr()!.playerName}
                                                                        </div>
                                                                        <div class="text-sm text-gray-500 dark:text-gray-400">
                                                                            {wr()!.miiName}
                                                                        </div>
                                                                    </div>
                                                                    <CountryFlag
                                                                        countryAlpha2={wr()!.countryAlpha2}
                                                                        countryName={wr()!.countryName}
                                                                        size="md"
                                                                    />
                                                                </div>
                                                            </A>
                                                        </Show>
                                                    </td>

                                                    {/* Character */}
                                                    <td class="px-6 py-4 hidden md:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getCharacterName(wr()!.characterId)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Vehicle */}
                                                    <td class="px-6 py-4 hidden lg:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getVehicleName(wr()!.vehicleId)}
                                                            </div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                {getDriftTypeName(wr()!.driftType)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Controller */}
                                                    <td class="px-6 py-4 hidden xl:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getControllerName(wr()!.controllerType)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Date */}
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                                        <Show when={wr()}>
                                                            {formatDate(wr()!.dateSet)}
                                                        </Show>
                                                    </td>
                                                </tr>
                                            );
                                        }}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}