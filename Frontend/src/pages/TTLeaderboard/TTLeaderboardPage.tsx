import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useTTTrackBrowser } from "../../hooks/useTTTrackBrowser";
import { LoadingSpinner } from "../../components/common";
import { CountryFlag } from "../../components/common";
import { TTBrowserFilters } from "../../components/ui";
import { getCharacterName, getControllerName, getDriftCategoryName, getDriftTypeName, getVehicleName } from "../../utils/marioKartMappings";

export default function TTLeaderboardPage() {
    const browser = useTTTrackBrowser();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getDriftInfo = (driftType: number, driftCategory: number) => {
        const type = getDriftTypeName(driftType);
        const category = getDriftCategoryName(driftCategory);
        return `${type} ${category.replace(" Drift", "")}`;
    };

    const getTrackRoute = (trackId: number) => {
        const cc = browser.selectedCC();
        const allowed = browser.glitchAllowed();
        return allowed
            ? `/timetrial/${cc}cc/${trackId}`
            : `/timetrial/no-glitch-${cc}cc/${trackId}`;
    };

    const headerGradient = () =>
        !browser.glitchAllowed()
            ? "bg-gradient-to-r from-green-600 to-emerald-600"
            : "bg-blue-600";

    return (
        <div class="space-y-8">
            {/* Hero */}
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
            <TTBrowserFilters
                selectedCategory={browser.selectedCategory()}
                selectedCC={browser.selectedCC()}
                glitchAllowed={browser.glitchAllowed()}
                shroomlessFilter={browser.shroomlessFilter()}
                vehicleFilter={browser.vehicleFilter()}
                searchQuery={browser.searchQuery()}
                onCategoryChange={browser.handleCategoryChange}
                onCCChange={browser.handleCCChange}
                onGlitchAllowedChange={browser.handleGlitchAllowedChange}
                onShroomlessFilterChange={browser.handleShroomlessFilterChange}
                onVehicleFilterChange={browser.handleVehicleFilterChange}
                onSearchInput={browser.handleSearchInput}
            />

            {/* Loading */}
            <Show when={browser.tracksQuery.isLoading || browser.worldRecordsQuery.isLoading}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
                    <LoadingSpinner />
                    <p class="mt-4 text-gray-600 dark:text-gray-400">
                        {browser.tracksQuery.isLoading ? "Loading tracks..." : "Loading world records..."}
                    </p>
                </div>
            </Show>

            {/* Error */}
            <Show when={browser.tracksQuery.isError || browser.worldRecordsQuery.isError}>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
                    <div class="text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h3 class="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                            {browser.tracksQuery.isError ? "Failed to load tracks" : "Failed to load world records"}
                        </h3>
                        <button
                            onClick={() => {
                                if (browser.tracksQuery.isError) browser.tracksQuery.refetch();
                                else browser.worldRecordsQuery.refetch();
                            }}
                            class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Tracks Table */}
            <Show when={
                browser.tracksQuery.data &&
                browser.worldRecordsQuery.data &&
                !browser.tracksQuery.isLoading &&
                !browser.worldRecordsQuery.isLoading
            }>
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class={`px-4 sm:px-6 py-4 ${headerGradient()}`}>
                        <h2 class="text-xl sm:text-2xl font-bold text-white">
                            {browser.selectedCategory() === "retro" ? "Retro Tracks" : "Custom Tracks"}
                        </h2>
                        <p class="text-blue-100 text-xs sm:text-sm">
                            {browser.filteredTracks().length} track{browser.filteredTracks().length !== 1 ? "s" : ""} •{" "}
                            {browser.selectedCC()}cc •{" "}
                            {!browser.glitchAllowed() ? "Non-Glitch/Shortcut" : "Unrestricted"} •{" "}
                            {browser.vehicleFilter() !== "all"
                                ? browser.vehicleFilter().charAt(0).toUpperCase() + browser.vehicleFilter().slice(1)
                                : "All Vehicles"
                            } •{" "}
                            {browser.shroomlessFilter() === "only"
                                ? "Shroomless"
                                : browser.shroomlessFilter() === "exclude"
                                    ? "No Shroomless"
                                    : "All Categories"
                            }
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
                                <thead class={`text-white ${!browser.glitchAllowed() ? "bg-green-600" : "bg-blue-600"}`}>
                                    <tr>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Track</th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <span class="hidden sm:inline">World Record</span>
                                            <span class="sm:hidden">WR</span>
                                        </th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <span class="hidden sm:inline">Record Holder</span>
                                            <span class="sm:hidden">Holder</span>
                                        </th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Character</th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Vehicle</th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">Controller</th>
                                        <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell">Date Set</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <For each={browser.filteredTracks()}>
                                        {(track) => {
                                            const wr = browser.getWorldRecordForTrack(track.id);
                                            return (
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    {/* Track Name */}
                                                    <td class="px-3 sm:px-6 py-4">
                                                        <A
                                                            href={getTrackRoute(track.id)}
                                                            class="block hover:opacity-80 transition-opacity"
                                                        >
                                                            <div class="font-semibold text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                                {track.name}
                                                                <Show when={track.supportsGlitch}>
                                                                    <span class="ml-2 text-purple-600 dark:text-purple-400 text-sm">⚡</span>
                                                                </Show>
                                                            </div>
                                                            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                {track.laps} lap{track.laps !== 1 ? "s" : ""}
                                                            </div>
                                                        </A>
                                                    </td>

                                                    {/* WR Time */}
                                                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <Show
                                                            when={wr()}
                                                            fallback={
                                                                <span class="text-xs sm:text-sm text-gray-400 dark:text-gray-500 italic">
                                                                    <span class="hidden sm:inline">No record yet</span>
                                                                    <span class="sm:hidden">—</span>
                                                                </span>
                                                            }
                                                        >
                                                            <div class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                                                                {wr()!.finishTimeDisplay}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Record Holder */}
                                                    <td class="px-3 sm:px-6 py-4">
                                                        <Show when={wr()}>
                                                            <A
                                                                href={`/timetrial/player/${wr()!.ttProfileId}`}
                                                                class="block hover:opacity-80 transition-opacity"
                                                            >
                                                                <div class="flex items-center gap-2">
                                                                    <div class="min-w-0">
                                                                        <div class="font-medium text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                                                                            {wr()!.playerName}
                                                                        </div>
                                                                        <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                            {wr()!.miiName}
                                                                        </div>
                                                                    </div>
                                                                    <CountryFlag
                                                                        countryAlpha2={wr()!.countryAlpha2}
                                                                        countryName={wr()!.countryName}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            </A>
                                                        </Show>
                                                    </td>

                                                    {/* Character */}
                                                    <td class="px-3 sm:px-6 py-4 hidden md:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getCharacterName(wr()!.characterId)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Vehicle */}
                                                    <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getVehicleName(wr()!.vehicleId)}
                                                            </div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                {getDriftInfo(wr()!.driftType, wr()!.driftCategory)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Controller */}
                                                    <td class="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                                        <Show when={wr()}>
                                                            <div class="text-sm text-gray-900 dark:text-white">
                                                                {getControllerName(wr()!.controllerType)}
                                                            </div>
                                                        </Show>
                                                    </td>

                                                    {/* Date */}
                                                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
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
