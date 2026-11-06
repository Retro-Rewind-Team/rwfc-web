import { createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { Search, TriangleAlert, Trophy, Zap } from "lucide-solid";
import { useTTTrackBrowser } from "../../hooks/useTTTrackBrowser";
import { CountryFlag, LoadingSpinner } from "../../components/common";
import { TTBrowserFilters } from "../../components/ui";
import {
    getCharacterName,
    getControllerName,
    getVehicleName,
} from "../../constants/marioKartMappings";
import { formatDate, getDriftInfo } from "../../utils/formatter";
import { TT_LEADERBOARD_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";
import { ButtonLink } from "../../components/common/Button";

export default function TTLeaderboardPage() {
    const browser = useTTTrackBrowser();

    const getTrackRoute = (trackId: number) => {
        const cc = browser.selectedCC();
        const allowed = browser.glitchAllowed();
        return allowed
            ? `/timetrial/${cc}cc/${trackId}`
            : `/timetrial/no-glitch-${cc}cc/${trackId}`;
    };

    return (
        <>
            <PageHeader
                page="tt"
                title="Time trials"
                description="World records for every Retro Rewind track, across each CC and category. Pick a track to see its full leaderboard and record history."
                actions={
                    <ButtonLink
                        href="/timetrial/rankings"
                        variant="secondary"
                        class="bg-transparent hover:bg-surface"
                    >
                        <Trophy size={16} aria-hidden="true" />
                        Player rankings
                    </ButtonLink>
                }
            />
            <div class="space-y-8">
                <Title>{TT_LEADERBOARD_META.title}</Title>
                <Meta name="description" content={TT_LEADERBOARD_META.description} />
                {/* Page Title */}

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
                    <div class="bg-canvas rounded-lg border border-line p-12 flex flex-col items-center gap-4">
                        <LoadingSpinner />
                        <p class="text-fg-muted">
                            {browser.tracksQuery.isLoading
                                ? "Loading tracks..."
                                : "Loading world records..."}
                        </p>
                    </div>
                </Show>

                {/* Error */}
                <Show when={browser.tracksQuery.isError || browser.worldRecordsQuery.isError}>
                    <div class="bg-canvas rounded-lg border border-red-200 dark:border-red-800 p-8">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center text-red-400">
                                <TriangleAlert size={48} />
                            </div>
                            <h3 class="text-xl font-semibold text-red-900 dark:text-red-100">
                                {browser.tracksQuery.isError
                                    ? "Failed to load tracks"
                                    : "Failed to load world records"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if (browser.tracksQuery.isError) browser.tracksQuery.refetch();
                                    else browser.worldRecordsQuery.refetch();
                                }}
                                class="bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </Show>

                {/* Tracks Table */}
                <Show
                    when={
                        browser.tracksQuery.data &&
                        browser.worldRecordsQuery.data &&
                        !browser.tracksQuery.isLoading &&
                        !browser.worldRecordsQuery.isLoading
                    }
                >
                    <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                        <div class="px-4 sm:px-6 py-4 bg-surface border-b border-line">
                            <h2 class="text-xl sm:text-2xl font-semibold text-fg">
                                {browser.selectedCategory() === "retro"
                                    ? "Retro Tracks"
                                    : "Custom Tracks"}
                            </h2>
                            <p class="text-fg-subtle text-xs sm:text-sm">
                                {browser.filteredTracks().length} track
                                {browser.filteredTracks().length !== 1 ? "s" : ""} •{" "}
                                {browser.selectedCC()}cc •{" "}
                                {!browser.glitchAllowed() ? "Non-Glitch/Shortcut" : "Unrestricted"}{" "}
                                •{" "}
                                {browser.vehicleFilter() !== "all"
                                    ? browser.vehicleFilter().charAt(0).toUpperCase() +
                                      browser.vehicleFilter().slice(1)
                                    : "All Vehicles"}{" "}
                                •{" "}
                                {browser.shroomlessFilter() === "only"
                                    ? "Shroomless"
                                    : browser.shroomlessFilter() === "exclude"
                                      ? "No Shroomless"
                                      : "All Categories"}
                            </p>
                        </div>

                        <Show
                            when={browser.filteredTracks().length > 0}
                            fallback={
                                <div class="p-12 text-center">
                                    <div class="flex justify-center mb-4 text-fg-subtle">
                                        <Search size={48} />
                                    </div>
                                    <h3 class="text-xl font-semibold text-fg mb-2">
                                        No tracks found
                                    </h3>
                                    <p class="text-fg-muted">Try adjusting your search</p>
                                </div>
                            }
                        >
                            <div class="relative overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-surface border-b border-line">
                                        <tr>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                                                Track
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                                                <span class="hidden sm:inline">World Record</span>
                                                <span class="sm:hidden">WR</span>
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
                                                <span class="hidden sm:inline">Record Holder</span>
                                                <span class="sm:hidden">Holder</span>
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium hidden md:table-cell">
                                                Character
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium hidden lg:table-cell">
                                                Vehicle
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium hidden xl:table-cell">
                                                Controller
                                            </th>
                                            <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium hidden xl:table-cell">
                                                Date Set
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-line">
                                        <For each={browser.filteredTracks()}>
                                            {(track) => {
                                                // createMemo is used here so each row independently tracks
                                                // worldRecordsQuery.data and updates when it changes
                                                const wr = createMemo(() => {
                                                    const records =
                                                        browser.worldRecordsQuery.data ?? [];
                                                    return (
                                                        records.find((r) => r.trackId === track.id)
                                                            ?.activeWorldRecord ?? null
                                                    );
                                                });

                                                return (
                                                    <tr class="hover:bg-surface transition-colors">
                                                        <td class="px-3 sm:px-6 py-4">
                                                            <A
                                                                href={getTrackRoute(track.id)}
                                                                class="block hover:opacity-80 transition-opacity"
                                                            >
                                                                <div class="font-semibold text-sm sm:text-base text-fg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                                    {track.name}
                                                                    <Show
                                                                        when={track.supportsGlitch}
                                                                    >
                                                                        <Zap
                                                                            size={14}
                                                                            class="ml-2 inline-block text-purple-600 dark:text-purple-400"
                                                                        />
                                                                    </Show>
                                                                </div>
                                                                <div class="text-xs sm:text-sm text-fg-subtle">
                                                                    {track.laps} lap
                                                                    {track.laps !== 1 ? "s" : ""}
                                                                </div>
                                                            </A>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                            <Show
                                                                when={wr()}
                                                                fallback={
                                                                    <span class="text-xs sm:text-sm text-fg-subtle italic">
                                                                        <span class="hidden sm:inline">
                                                                            No record yet
                                                                        </span>
                                                                        <span class="sm:hidden">
                                                                            -
                                                                        </span>
                                                                    </span>
                                                                }
                                                            >
                                                                <div class="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                                    {wr()!.finishTimeDisplay}
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4">
                                                            <Show when={wr()}>
                                                                <A
                                                                    href={`/timetrial/player/${wr()!.ttProfileId}`}
                                                                    class="block hover:opacity-80 transition-opacity"
                                                                >
                                                                    <div class="flex items-center gap-2">
                                                                        <div class="min-w-0">
                                                                            <div class="font-medium text-sm sm:text-base text-fg hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                                                                                {wr()!.playerName}
                                                                            </div>
                                                                            <div class="text-xs sm:text-sm text-fg-subtle truncate">
                                                                                {wr()!.miiName}
                                                                            </div>
                                                                        </div>
                                                                        <CountryFlag
                                                                            countryAlpha2={
                                                                                wr()!.countryAlpha2
                                                                            }
                                                                            countryName={
                                                                                wr()!.countryName
                                                                            }
                                                                            size="sm"
                                                                        />
                                                                    </div>
                                                                </A>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4 hidden md:table-cell">
                                                            <Show when={wr()}>
                                                                <div class="text-sm text-fg">
                                                                    {getCharacterName(
                                                                        wr()!.characterId,
                                                                    )}
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                                            <Show when={wr()}>
                                                                <div class="text-sm text-fg">
                                                                    {getVehicleName(
                                                                        wr()!.vehicleId,
                                                                    )}
                                                                </div>
                                                                <div class="text-xs text-fg-subtle">
                                                                    {getDriftInfo(
                                                                        wr()!.driftType,
                                                                        wr()!.driftCategory,
                                                                    )}
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                                            <Show when={wr()}>
                                                                <div class="text-sm text-fg">
                                                                    {getControllerName(
                                                                        wr()!.controllerType,
                                                                    )}
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-fg-subtle hidden xl:table-cell">
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
        </>
    );
}
