import { createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { Search, Trophy, Zap } from "lucide-solid";
import { useTTTrackBrowser } from "../../hooks/useTTTrackBrowser";
import {
    Button,
    CountryFlag,
    EmptyState,
    LiveRegion,
    QueryError,
    type SkeletonColumn,
    TableSkeleton,
} from "../../components/common";
import TTBrowserFilters from "../../components/ui/timeTrial/TTBrowserFilters";
import {
    getCharacterName,
    getControllerName,
    getVehicleName,
} from "../../constants/marioKartMappings";
import { formatDate, getDriftInfo } from "../../utils/formatter";
import { TT_LEADERBOARD_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";
import { ButtonLink } from "../../components/common/Button";

// Same columns and breakpoints as the track table below, so it does not shift when data arrives.
const TRACK_COLUMNS: SkeletonColumn[] = [
    { header: "Track", class: "pin-start sm:px-6", bar: "w-32" },
    { header: "World Record", class: "sm:px-6", bar: "w-16" },
    { header: "Record Holder", class: "sm:px-6", bar: "w-28" },
    { header: "Character", class: "hidden md:table-cell sm:px-6", bar: "w-20" },
    { header: "Vehicle", class: "hidden lg:table-cell sm:px-6", bar: "w-24" },
    { header: "Controller", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
    { header: "Date Set", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
];

export default function TTLeaderboardPage() {
    const browser = useTTTrackBrowser();

    const getTrackRoute = (trackId: number) => {
        const cc = browser.selectedCC();
        const allowed = browser.glitchAllowed();
        return allowed
            ? `/timetrial/${cc}cc/${trackId}`
            : `/timetrial/no-glitch-${cc}cc/${trackId}`;
    };

    // Blank until both queries have settled (the skeleton and the error alert announce themselves).
    const resultsMessage = () => {
        if (
            browser.tracksQuery.isLoading ||
            browser.worldRecordsQuery.isLoading ||
            browser.tracksQuery.isError ||
            browser.worldRecordsQuery.isError ||
            !browser.tracksQuery.data ||
            !browser.worldRecordsQuery.data
        ) {
            return "";
        }
        const count = browser.filteredTracks().length;
        if (count === 0) return "No tracks match these filters.";
        return `${count} ${count === 1 ? "track" : "tracks"} shown.`;
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
                <LiveRegion message={resultsMessage()} />

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
                    <div class="overflow-hidden rounded-lg border border-line bg-canvas">
                        <TableSkeleton
                            label={
                                browser.tracksQuery.isLoading
                                    ? "Loading tracks"
                                    : "Loading world records"
                            }
                            columns={TRACK_COLUMNS}
                            rows={10}
                            rowClass="h-[4.75rem]"
                        />
                    </div>
                </Show>

                {/* Error */}
                <Show when={browser.tracksQuery.isError || browser.worldRecordsQuery.isError}>
                    <QueryError
                        title={
                            browser.tracksQuery.isError
                                ? "Couldn't load the tracks"
                                : "Couldn't load the world records"
                        }
                        error={browser.tracksQuery.error ?? browser.worldRecordsQuery.error}
                        onRetry={() =>
                            browser.tracksQuery.isError
                                ? browser.tracksQuery.refetch()
                                : browser.worldRecordsQuery.refetch()
                        }
                    />
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
                                <EmptyState
                                    icon={<Search size={40} />}
                                    title={
                                        browser.search()
                                            ? `No tracks match "${browser.search()}"`
                                            : "No tracks in this category"
                                    }
                                    action={
                                        <Show when={browser.search()}>
                                            <Button
                                                variant="secondary"
                                                onClick={browser.clearSearch}
                                            >
                                                Clear search
                                            </Button>
                                        </Show>
                                    }
                                >
                                    {browser.search()
                                        ? "Check the spelling, or search for part of the name."
                                        : "Switch between Retro and Custom to see the other list."}
                                </EmptyState>
                            }
                        >
                            <div class="relative overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-surface border-b border-line">
                                        <tr>
                                            <th class="pin-start px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200">
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
                                                        <td class="pin-start px-3 sm:px-6 py-4">
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
