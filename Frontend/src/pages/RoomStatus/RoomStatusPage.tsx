import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { useRoomStatus } from "../../hooks/useRoom";
import { useMiiLoader } from "../../hooks/useMiiLoader";
import { roomStatusApi } from "../../services/api/room";
import RoomCard from "../../components/ui/room/RoomCard";
import ServerActivityChart from "../../components/ui/room/ServerActivityChart";
import { Tooltip } from "../../components/common";
import { buttonClass } from "../../components/common/Button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    Inbox,
    Info,
    Lock,
    Search,
    ServerCrash,
    TrendingUp,
    Users,
    X,
} from "lucide-solid/icons/index";
import { Meta, Title } from "@solidjs/meta";
import { ROOM_BROWSER_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

export default function RoomStatusPage() {
    // Declared before useRoomStatus so its pausePolling accessor is safe to call immediately.
    const [highlightFc, setHighlightFc] = createSignal("");
    const activeFc = createMemo(() => {
        const fc = highlightFc().trim();
        return /^\d{4}-\d{4}-\d{4}$/.test(fc) ? fc : undefined;
    });

    const {
        state: { isLatest, canGoForward, canGoBackward, currentDateTimeLocal },
        queries: { statsQuery, roomStatusQuery },
        nav: { goForward, goBackward, goToLatest, goToOldest, jumpByMinutes, goToDateTime },
        utils: { getAllFriendCodes, getRoomUptime },
    } = useRoomStatus({ pausePolling: () => !!activeFc() });

    const miiLoader = useMiiLoader();
    const [tick, setTick] = createSignal(0);
    const [isJumping, setIsJumping] = createSignal(false);
    const [sortByVR, setSortByVR] = createSignal(false);
    const [hidePrivate, setHidePrivate] = createSignal(false);
    const [hideFull, setHideFull] = createSignal(false);

    const playersOnlineValue = createMemo(() =>
        isLatest()
            ? (statsQuery.data?.totalPlayers ?? 0)
            : (roomStatusQuery.data?.totalPlayers ?? 0),
    );
    const playersOnlineLabel = createMemo(() =>
        isLatest() ? "Players online" : "Players at this time",
    );

    const visibleRooms = createMemo(() => {
        let rooms = roomStatusQuery.data?.rooms ?? [];
        const fc = activeFc();
        if (fc) rooms = rooms.filter((r) => r.players.some((p) => p.friendCode === fc));
        if (hidePrivate()) rooms = rooms.filter((r) => r.isPublic);
        if (hideFull()) rooms = rooms.filter((r) => r.players.length < 12);
        // Empty rooms go last so active ones are seen first. Array sort is stable, so rooms keep
        // the server order within each group.
        if (!sortByVR()) {
            return [...rooms].sort(
                (a, b) => Number(a.players.length === 0) - Number(b.players.length === 0),
            );
        }
        return [...rooms].sort((a, b) => {
            if (a.averageVR === null && b.averageVR === null) return 0;
            if (a.averageVR === null) return 1;
            if (b.averageVR === null) return -1;
            return b.averageVR - a.averageVR;
        });
    });

    // Live uptime ticker
    createEffect(() => {
        const interval = setInterval(() => {
            if (isLatest()) setTick((t) => t + 1);
        }, 1000);
        onCleanup(() => clearInterval(interval));
    });

    // Load Miis when rooms change. Loaded through the room endpoint, which reads Mii data from the
    // room snapshot itself and falls back to the leaderboard: a player visible in a room but absent
    // from the Players table has no leaderboard Mii and would otherwise show no avatar at all.
    createEffect(() => {
        const friendCodes = getAllFriendCodes();
        if (friendCodes.length > 0) {
            setTimeout(() => miiLoader.loadMiisBatch(friendCodes, roomStatusApi.getMiisBatch), 100);
        }
    });

    const handleJump = async (minutes: number) => {
        setIsJumping(true);
        try {
            await jumpByMinutes(minutes);
        } finally {
            setIsJumping(false);
        }
    };

    const handleDateTimeChange = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (!input.value) return;
        setIsJumping(true);
        try {
            await goToDateTime(new Date(input.value));
        } finally {
            setIsJumping(false);
        }
    };

    return (
        <>
            <PageHeader
                page="rooms"
                title="Rooms"
                description="Live rooms and players on the Retro WFC servers. Step back through earlier snapshots to see who was racing and where."
                visual={
                    <Show when={statsQuery.data}>
                        <dl class="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface">
                            <div class="p-4 sm:p-5">
                                <dt class="text-xs text-fg-muted sm:text-sm">
                                    {playersOnlineLabel()}
                                </dt>
                                <dd class="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">
                                    {playersOnlineValue()}
                                </dd>
                            </div>
                            <div class="p-4 sm:p-5">
                                <dt class="text-xs text-fg-muted sm:text-sm">Active rooms</dt>
                                <dd class="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">
                                    {statsQuery.data!.totalRooms}
                                </dd>
                            </div>
                            <div class="p-4 sm:p-5">
                                <dt class="text-xs text-fg-muted sm:text-sm">Peak today</dt>
                                <dd class="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">
                                    {statsQuery.data!.peakPlayersToday}
                                </dd>
                                <dd class="mt-1 text-xs text-fg-subtle">
                                    All-time: {statsQuery.data!.peakPlayersAllTime}
                                </dd>
                            </div>
                        </dl>
                    </Show>
                }
            />
            <div class="space-y-8">
                <Title>{ROOM_BROWSER_META.title}</Title>
                <Meta name="description" content={ROOM_BROWSER_META.description} />
                {/* Hero Header */}

                {/* Navigation Controls */}
                <Show when={roomStatusQuery.data}>
                    <div class="bg-canvas rounded-lg border border-line p-4 sm:p-6">
                        <div class="flex flex-col gap-4">
                            {/* Top row: step buttons + LIVE badge + highlight FC */}
                            <div class="flex items-center justify-between gap-3 flex-wrap">
                                <div class="flex items-center gap-2">
                                    {/* Jump to oldest */}
                                    <Tooltip text="Jump to oldest">
                                        <button
                                            type="button"
                                            onClick={goToOldest}
                                            disabled={!canGoBackward()}
                                            aria-label="Jump to oldest snapshot"
                                            class={buttonClass("secondary", "icon")}
                                        >
                                            <ChevronsLeft size={20} />
                                        </button>
                                    </Tooltip>

                                    {/* Previous */}
                                    <button
                                        type="button"
                                        onClick={goBackward}
                                        disabled={!canGoBackward()}
                                        class={buttonClass("secondary", "md")}
                                    >
                                        <ChevronLeft size={16} />
                                        <span class="hidden sm:inline">Previous</span>
                                        <span class="sr-only sm:hidden">Previous snapshot</span>
                                    </button>

                                    {/* Next */}
                                    <button
                                        type="button"
                                        onClick={goForward}
                                        disabled={!canGoForward()}
                                        class={buttonClass("secondary", "md")}
                                    >
                                        <span class="hidden sm:inline">Next</span>
                                        <span class="sr-only sm:hidden">Next snapshot</span>
                                        <ChevronRight size={16} />
                                    </button>

                                    {/* Jump to latest */}
                                    <Tooltip text="Jump to latest">
                                        <button
                                            type="button"
                                            onClick={goToLatest}
                                            disabled={isLatest()}
                                            aria-label="Jump to latest snapshot"
                                            class={buttonClass("secondary", "icon")}
                                        >
                                            <ChevronsLeft size={20} class="rotate-180" />
                                        </button>
                                    </Tooltip>

                                    <Show when={isLatest()}>
                                        <div class="flex items-center rounded-md border border-line px-3 sm:px-4 py-2 flex-shrink-0">
                                            <span
                                                class="w-2 h-2 bg-accent rounded-full mr-2"
                                                aria-hidden="true"
                                            />
                                            <span class="text-xs sm:text-sm font-medium text-fg">
                                                Live
                                            </span>
                                        </div>
                                    </Show>
                                </div>

                                {/* Right side: sort toggle + highlight FC input + status indicators */}
                                <div class="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        aria-pressed={sortByVR()}
                                        onClick={() => setSortByVR((v) => !v)}
                                        class={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                                            sortByVR()
                                                ? "border-accent bg-accent-soft text-accent-text"
                                                : "border-line bg-canvas text-fg-muted hover:border-line-strong hover:text-fg"
                                        }`}
                                        title={
                                            sortByVR()
                                                ? "Sorted by average VR"
                                                : "Sort by average VR"
                                        }
                                    >
                                        <TrendingUp size={14} />
                                        <span class="sr-only sm:not-sr-only">Avg VR</span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={hidePrivate()}
                                        onClick={() => setHidePrivate((v) => !v)}
                                        class={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                                            hidePrivate()
                                                ? "border-accent bg-accent-soft text-accent-text"
                                                : "border-line bg-canvas text-fg-muted hover:border-line-strong hover:text-fg"
                                        }`}
                                        title={
                                            hidePrivate()
                                                ? "Showing public rooms only"
                                                : "Hide private rooms"
                                        }
                                    >
                                        <Lock size={14} />
                                        <span class="sr-only sm:not-sr-only">Public only</span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={hideFull()}
                                        onClick={() => setHideFull((v) => !v)}
                                        class={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                                            hideFull()
                                                ? "border-accent bg-accent-soft text-accent-text"
                                                : "border-line bg-canvas text-fg-muted hover:border-line-strong hover:text-fg"
                                        }`}
                                        title={hideFull() ? "Hiding full rooms" : "Hide full rooms"}
                                    >
                                        <Users size={14} />
                                        <span class="sr-only sm:not-sr-only">Hide full</span>
                                    </button>

                                    <div class="relative">
                                        <Search
                                            size={13}
                                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                        <input
                                            type="text"
                                            value={highlightFc()}
                                            onInput={(e) => setHighlightFc(e.currentTarget.value)}
                                            placeholder="Highlight FC"
                                            maxlength={14}
                                            spellcheck={false}
                                            aria-label="Highlight a friend code"
                                            class="h-9 w-40 rounded-md border border-line-strong bg-canvas pr-7 pl-8 font-mono text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-fg-subtle"
                                        />
                                        <Show when={highlightFc()}>
                                            <button
                                                type="button"
                                                onClick={() => setHighlightFc("")}
                                                class="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg transition-colors"
                                                title="Clear"
                                                aria-label="Clear friend code"
                                            >
                                                <X size={13} />
                                            </button>
                                        </Show>
                                    </div>

                                    <Show when={isLatest() && activeFc()}>
                                        <span class="text-xs text-warn-fg font-semibold whitespace-nowrap">
                                            Auto-refresh paused
                                        </span>
                                    </Show>

                                    <Show when={!isLatest()}>
                                        <div class="text-xs text-warn-fg font-semibold flex items-center gap-1.5 bg-warn-bg px-3 py-1.5 rounded-full border border-warn-line">
                                            <Info size={14} />
                                            Historical data
                                        </div>
                                    </Show>
                                </div>
                            </div>

                            {/* Bottom row: time jump controls */}
                            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                                {/* Quick jump buttons (backward) */}
                                <div class="flex gap-2">
                                    {([-60, -1] as const).map((mins) => (
                                        <button
                                            type="button"
                                            onClick={() => handleJump(mins)}
                                            disabled={isJumping() || !canGoBackward()}
                                            class="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold border border-line bg-canvas text-fg-muted hover:bg-surface hover:text-fg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                                        >
                                            {mins === -60 ? "-1h" : "-1m"}
                                        </button>
                                    ))}
                                </div>

                                {/* Datetime picker */}
                                <div class="relative w-full sm:flex-1 sm:min-w-[200px]">
                                    <input
                                        type="datetime-local"
                                        aria-label="Snapshot date and time"
                                        value={currentDateTimeLocal()}
                                        onChange={handleDateTimeChange}
                                        disabled={isJumping()}
                                        class="h-10 w-full rounded-md border border-line-strong bg-canvas px-3 text-sm text-fg transition-colors hover:border-fg-subtle disabled:opacity-50"
                                    />
                                    <Show when={isJumping()}>
                                        <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                            <div class="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    </Show>
                                </div>

                                {/* Quick jump buttons (forward) */}
                                <div class="flex gap-2">
                                    {([1, 60] as const).map((mins) => (
                                        <button
                                            type="button"
                                            onClick={() => handleJump(mins)}
                                            disabled={isJumping() || !canGoForward()}
                                            class="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold border border-line bg-canvas text-fg-muted hover:bg-surface hover:text-fg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                                        >
                                            {mins === 60 ? "+1h" : "+1m"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Loading State */}
                <Show when={roomStatusQuery.isLoading}>
                    <div class="bg-canvas rounded-lg border border-line p-16 text-center">
                        <div class="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6" />
                        <p class="text-xl text-fg-muted font-semibold">Loading room data...</p>
                    </div>
                </Show>

                {/* Error State */}
                <Show when={roomStatusQuery.isError}>
                    <div class="bg-canvas border border-red-200 dark:border-red-800 rounded-lg p-12">
                        <div class="text-center">
                            <div class="flex justify-center mb-6 text-red-400 dark:text-red-500">
                                <ServerCrash size={48} />
                            </div>
                            <div class="text-red-600 dark:text-red-400 text-2xl font-semibold mb-3">
                                Couldn't load room data
                            </div>
                            <p class="text-red-600 dark:text-red-400 mb-8">
                                {roomStatusQuery.error?.message || "Something went wrong"}
                            </p>
                            <button
                                type="button"
                                onClick={() => roomStatusQuery.refetch()}
                                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-10 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </Show>

                {/* No Data State */}
                <Show
                    when={
                        roomStatusQuery.data &&
                        !roomStatusQuery.isLoading &&
                        roomStatusQuery.data.rooms.length === 0 &&
                        !activeFc()
                    }
                >
                    <div class="bg-canvas border border-warn-line rounded-lg p-12">
                        <div class="text-center">
                            <div class="flex justify-center mb-6 text-amber-300 dark:text-amber-600">
                                <Inbox size={48} />
                            </div>
                            <div class="text-fg text-2xl font-semibold mb-3">No rooms found</div>
                            <p class="text-fg-muted mb-2">
                                Nobody is racing right now, or the server may be experiencing
                                issues.
                            </p>
                            <p class="text-sm text-fg-subtle">
                                Use the navigation controls to view historical data
                            </p>
                        </div>
                    </div>
                </Show>

                {/* FC Not Found State */}
                <Show
                    when={
                        roomStatusQuery.data &&
                        !roomStatusQuery.isLoading &&
                        activeFc() &&
                        visibleRooms().length === 0
                    }
                >
                    <div class="bg-canvas border border-warn-line rounded-lg p-12">
                        <div class="text-center">
                            <div class="flex justify-center mb-6 text-amber-300 dark:text-amber-600">
                                <Search size={48} />
                            </div>
                            <div class="text-fg text-2xl font-semibold mb-3">Player not found</div>
                            <p class="text-fg-muted">
                                No room contains{" "}
                                <code class="font-mono bg-surface px-2 py-0.5 rounded">
                                    {activeFc()}
                                </code>{" "}
                                in this snapshot.
                            </p>
                        </div>
                    </div>
                </Show>

                {/* Rooms List */}
                <Show
                    when={
                        roomStatusQuery.data &&
                        !roomStatusQuery.isLoading &&
                        visibleRooms().length > 0
                    }
                >
                    <div class="space-y-6">
                        <For each={visibleRooms()}>
                            {(room) => (
                                <RoomCard
                                    room={room}
                                    getRoomUptime={getRoomUptime}
                                    isLatest={isLatest()}
                                    tick={tick()}
                                    highlightFc={activeFc()}
                                />
                            )}
                        </For>
                    </div>
                </Show>

                {/* Server Activity Chart */}
                <ServerActivityChart />
            </div>
        </>
    );
}
