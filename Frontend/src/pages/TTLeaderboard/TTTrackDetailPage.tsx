import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, Show } from "solid-js";
import { Trophy, Zap } from "lucide-solid";
import { Meta, Title } from "@solidjs/meta";
import { useTTTrackDetail } from "../../hooks/useTTTrackDetail";
import {
    Button,
    EmptyState,
    InlinePagination,
    QueryError,
    SkeletonBar,
    type SkeletonColumn,
    TableSkeleton,
} from "../../components/common";
import TTFilters from "../../components/ui/timeTrial/TTFilters";
import TTLeaderboardTable from "../../components/ui/timeTrial/TTLeaderboardTable";
import TTWRHistory from "../../components/ui/timeTrial/TTWRHistory";
import { LeaderboardMode } from "../../types/timeTrial";
import { DYNAMIC_META_DEFAULTS } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

// Same columns and breakpoints as TTLeaderboardTable, so it does not shift when data arrives.
const TIME_COLUMNS: SkeletonColumn[] = [
    { header: "Rank", class: "pin-start w-14 sm:w-22 sm:px-6", bar: "w-6" },
    { header: "Player", class: "pin-start-2 sm:px-6", bar: "w-32" },
    { header: "Time", class: "sm:px-6", bar: "w-20" },
    { header: "Fastest Lap", class: "hidden md:table-cell sm:px-6", bar: "w-16" },
    { header: "Character", class: "hidden lg:table-cell sm:px-6", bar: "w-20" },
    { header: "Vehicle", class: "hidden lg:table-cell sm:px-6", bar: "w-24" },
    { header: "Controller", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
    { header: "Date", class: "hidden xl:table-cell sm:px-6", bar: "w-20" },
    { header: "Actions", align: "right", class: "sm:px-6", bar: "w-8" },
];

function parseRouteCC(ccParam: string): {
    cc: 150 | 200;
    glitchAllowed: boolean;
    mode: LeaderboardMode;
} {
    const isFlap = ccParam.startsWith("flap-");
    const withoutFlap = isFlap ? ccParam.slice("flap-".length) : ccParam;
    const isNoGlitch = withoutFlap.startsWith("no-glitch-");
    const withoutGlitch = isNoGlitch ? withoutFlap.slice("no-glitch-".length) : withoutFlap;
    const cc = withoutGlitch === "200cc" ? 200 : 150;
    return { cc, glitchAllowed: !isNoGlitch, mode: isFlap ? "flap" : "regular" };
}

export default function TTTrackDetailPage() {
    const params = useParams();
    const navigate = useNavigate();

    const parsed = createMemo(() => parseRouteCC(params.cc ?? "150cc"));
    const selectedCC = createMemo((): 150 | 200 => parsed().cc);
    const glitchAllowed = createMemo((): boolean => parsed().glitchAllowed);
    const mode = createMemo((): LeaderboardMode => parsed().mode);
    const trackId = createMemo(() => Number(params.trackId));

    const { filters, pagination, computed, queries, handlers } = useTTTrackDetail(
        trackId,
        selectedCC,
        glitchAllowed,
        mode,
    );

    // Redirect flap URLs to regular if the track has only 1 lap
    createEffect(() => {
        const track = queries.trackQuery.data;
        if (track && track.laps === 1 && mode() === "flap") {
            navigate(
                `/timetrial/${glitchAllowed() ? "" : "no-glitch-"}${selectedCC()}cc/${trackId()}`,
                {
                    replace: true,
                },
            );
        }
    });

    const categoryLabel = () => {
        const parts: string[] = [];
        if (mode() === "flap") parts.push("Flap");
        if (!glitchAllowed()) parts.push("Non-Glitch/Shortcut");
        parts.push(`${selectedCC()}cc`);
        return parts.join(" ");
    };

    const wrHistoryTitle = () =>
        mode() === "flap" ? "Flap Record History" : "World Record History";

    const wrHistorySubtitle = () =>
        mode() === "flap"
            ? "Track the progression of fastest lap records over time"
            : "Track the progression of world records over time";

    return (
        <>
            <PageHeader
                page="ttTrack"
                compact
                crumbs={[{ label: "Time trials", href: "/tt" }]}
                title={queries.trackQuery.data?.name ?? "Track"}
                description="The leaderboard and world record history for this track."
            />
            <div class="space-y-6">
                <Title>
                    {queries.trackQuery.data
                        ? `${queries.trackQuery.data.name} | Retro Rewind`
                        : DYNAMIC_META_DEFAULTS.ttTrackDetail.title}
                </Title>
                <Meta
                    name="description"
                    content={DYNAMIC_META_DEFAULTS.ttTrackDetail.description}
                />

                {/* Loading */}
                <Show when={queries.trackQuery.isLoading}>
                    <div class="overflow-hidden rounded-lg border border-line bg-canvas">
                        <div
                            class="border-b border-line bg-surface px-6 py-4"
                            role="status"
                            aria-busy="true"
                        >
                            <span class="sr-only">Loading track</span>
                            <SkeletonBar class="h-4 w-64" />
                        </div>
                        <TableSkeleton
                            label="Loading times"
                            columns={TIME_COLUMNS}
                            rows={pagination.pageSize()}
                            rowClass="h-22"
                        />
                    </div>
                </Show>

                {/* Error */}
                <Show when={queries.trackQuery.isError}>
                    <QueryError
                        title="Couldn't load this track"
                        error={queries.trackQuery.error}
                        onRetry={() => queries.trackQuery.refetch()}
                    />
                </Show>

                {/* Track Detail */}
                <Show when={queries.trackQuery.data}>
                    {(track) => (
                        <div class="space-y-6">
                            <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                                {/* Header */}
                                <div class="px-6 py-4 bg-surface border-b border-line">
                                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h2 class="sr-only">{track().name}</h2>
                                            <div class="flex items-center gap-3 text-sm text-fg-subtle">
                                                <span class="font-semibold">{categoryLabel()}</span>
                                                <span>•</span>
                                                <span>
                                                    {track().laps} lap
                                                    {track().laps !== 1 ? "s" : ""}
                                                </span>
                                                <span>•</span>
                                                <span class="capitalize">
                                                    {track().category} Track
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div class="bg-surface p-4 border-b border-line">
                                    <TTFilters
                                        trackId={trackId()}
                                        trackSupportsGlitch={track().supportsGlitch}
                                        trackLaps={track().laps}
                                        currentCC={selectedCC()}
                                        currentGlitchAllowed={glitchAllowed()}
                                        currentMode={mode()}
                                        shroomlessFilter={filters.shroomlessFilter()}
                                        vehicleFilter={filters.vehicleFilter()}
                                        driftFilter={filters.driftFilter()}
                                        driftCategoryFilter={filters.driftCategoryFilter()}
                                        pageSize={pagination.pageSize()}
                                        onShroomlessFilterChange={
                                            handlers.handleShroomlessFilterChange
                                        }
                                        onVehicleFilterChange={handlers.handleVehicleFilterChange}
                                        onDriftFilterChange={handlers.handleDriftFilterChange}
                                        onDriftCategoryFilterChange={
                                            handlers.handleDriftCategoryFilterChange
                                        }
                                        onPageSizeChange={pagination.handlePageSizeChange}
                                    />
                                </div>

                                {/* Leaderboard Loading */}
                                <Show when={queries.leaderboardQuery.isLoading}>
                                    <TableSkeleton
                                        label="Loading times"
                                        columns={TIME_COLUMNS}
                                        rows={pagination.pageSize()}
                                        rowClass="h-22"
                                    />
                                </Show>

                                {/* Leaderboard Error */}
                                <Show when={queries.leaderboardQuery.isError}>
                                    <div class="p-4 sm:p-6">
                                        <QueryError
                                            title="Couldn't load the times"
                                            error={queries.leaderboardQuery.error}
                                            onRetry={() => queries.leaderboardQuery.refetch()}
                                        />
                                    </div>
                                </Show>

                                {/* Leaderboard Table */}
                                <Show
                                    when={
                                        queries.leaderboardQuery.data &&
                                        !queries.leaderboardQuery.isLoading
                                    }
                                >
                                    <Show
                                        when={computed.filteredSubmissions().length > 0}
                                        fallback={
                                            <EmptyState
                                                icon={
                                                    mode() === "flap" ? (
                                                        <Zap size={40} />
                                                    ) : (
                                                        <Trophy size={40} />
                                                    )
                                                }
                                                title={
                                                    filters.hasFilters()
                                                        ? "No times match these filters"
                                                        : "No times submitted yet"
                                                }
                                                action={
                                                    <Show when={filters.hasFilters()}>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={filters.clearFilters}
                                                        >
                                                            Clear filters
                                                        </Button>
                                                    </Show>
                                                }
                                            >
                                                {filters.hasFilters()
                                                    ? "Try All for vehicle and shroomless, or switch the drift filters back to All."
                                                    : mode() === "flap"
                                                      ? "No flap runs have been submitted for this category yet."
                                                      : "Be the first to submit a time for this category."}
                                            </EmptyState>
                                        }
                                    >
                                        <TTLeaderboardTable
                                            submissions={computed.filteredSubmissions()}
                                            fastestLapMs={
                                                mode() === "regular"
                                                    ? (queries.flapQuery.data?.fastestLapMs ?? null)
                                                    : (queries.leaderboardQuery.data
                                                          ?.fastestLapMs ?? null)
                                            }
                                            trackLaps={track().laps}
                                            isFlap={mode() === "flap"}
                                            onDownloadGhost={handlers.handleDownloadGhost}
                                        />
                                    </Show>

                                    {/* Pagination */}
                                    <Show
                                        when={(queries.leaderboardQuery.data?.totalPages ?? 1) > 1}
                                    >
                                        <InlinePagination
                                            currentPage={pagination.currentPage()}
                                            totalPages={queries.leaderboardQuery.data!.totalPages}
                                            pageSize={pagination.pageSize()}
                                            totalItems={
                                                queries.leaderboardQuery.data!.totalSubmissions
                                            }
                                            onPageChange={pagination.setCurrentPage}
                                            itemLabel="times"
                                        />
                                    </Show>
                                </Show>
                            </div>

                            <TTWRHistory
                                history={computed.filteredWRHistory()}
                                isLoading={queries.activeWrHistoryQuery().isLoading}
                                isError={queries.activeWrHistoryQuery().isError}
                                onRetry={() => queries.activeWrHistoryQuery().refetch()}
                                onDownloadGhost={handlers.handleDownloadGhost}
                                title={wrHistoryTitle()}
                                subtitle={wrHistorySubtitle()}
                                isFlap={mode() === "flap"}
                            />
                        </div>
                    )}
                </Show>
            </div>
        </>
    );
}
