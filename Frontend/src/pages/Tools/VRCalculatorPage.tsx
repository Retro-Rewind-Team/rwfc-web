import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import {
    DEFAULT_DISPLAY_VR,
    DEFAULT_MODIFIERS,
    fmtDelta,
    fmtFixed,
    getMultiplier,
    MAX_DISPLAY_VR,
    MIN_DISPLAY_VR,
    type MultiplierInfo,
    type PlayerInput,
    type PlayerResult,
    simulate,
    type SimulationResult,
    VR_DISPLAY_SCALE,
    type VRModifiers,
} from "../../utils/vrCalculator";
import { multiplierApi, type MultiplierChannel } from "../../services/api/multiplier";
import { AlertBox } from "../../components/common";
import { Meta, Title } from "@solidjs/meta";
import { VR_CALCULATOR_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";

const PLAYER_LIMIT = { min: 2, max: 12 };

type ToggleModifier = Exclude<keyof VRModifiers, "serverMultiplier">;

const TOGGLES: { key: ToggleModifier; label: string; mult: string }[] = [
    { key: "weekend", label: "Weekend", mult: "1.5×" },
    { key: "battleElimination", label: "Battle Elimination", mult: "+0.166/player" },
    { key: "betaBuild", label: "Beta Build", mult: "1.25×" },
];

function makeDefaultPlayers(count: number): PlayerInput[] {
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, displayVr: DEFAULT_DISPLAY_VR }));
}

export default function VRCalculatorPage() {
    const [players, setPlayers] = createSignal<PlayerInput[]>(makeDefaultPlayers(12));
    const [playerCount, setPlayerCount] = createSignal(12);
    const [mods, setMods] = createSignal<VRModifiers>(DEFAULT_MODIFIERS);
    const [vrMode, setVrMode] = createSignal(true);
    const [allDisc, setAllDisc] = createSignal(false);
    const [minDisplay, setMinDisplay] = createSignal(MIN_DISPLAY_VR);
    const [maxDisplay, setMaxDisplay] = createSignal(MAX_DISPLAY_VR);
    const [serverEdited, setServerEdited] = createSignal(false);
    const [reverseMode, setReverseMode] = createSignal(false);
    const [reverseDeltas, setReverseDeltas] = createSignal<number[]>(Array(12).fill(0));
    const [traceOpen, setTraceOpen] = createSignal(false);
    const [expandedRows, setExpandedRows] = createSignal<Set<number>>(new Set());

    const visiblePlayers = createMemo(() => players().slice(0, playerCount()));

    const simResult = createMemo((): SimulationResult | null => {
        if (reverseMode()) return null;
        const ps = visiblePlayers();
        if (!ps.every((p) => Number.isFinite(p.displayVr))) return null;
        return simulate(ps, mods(), {
            vrMode: vrMode(),
            allDisconnected: allDisc(),
            minDisplay: minDisplay(),
            maxDisplay: maxDisplay(),
        });
    });

    const mult = createMemo((): MultiplierInfo => getMultiplier(mods(), playerCount()));

    // Events reach the game as a server multiplier, so start from the value it would download.
    // The beta build reads its own channel.
    const multiplierChannel = (): MultiplierChannel => (mods().betaBuild ? "beta" : "stable");
    const [liveMultiplier] = createResource(multiplierChannel, (channel) =>
        multiplierApi.getActive(channel).catch(() => null),
    );
    createEffect(() => {
        const live = liveMultiplier();
        if (live != null && !serverEdited()) {
            setMods((m) => ({ ...m, serverMultiplier: live }));
        }
    });
    const liveStatus = () => {
        if (liveMultiplier.loading) return "Loading the live value…";
        const live = liveMultiplier();
        return live == null
            ? "Live value unavailable"
            : `Live ${multiplierChannel()} value: ${live}×`;
    };

    const resultFor = (id: number): PlayerResult | undefined =>
        simResult()?.players.find((p) => p.id === id);

    const changeCount = (n: number) => {
        const clamped = Math.max(PLAYER_LIMIT.min, Math.min(PLAYER_LIMIT.max, n));
        setPlayerCount(clamped);
        setPlayers((prev) => {
            if (clamped <= prev.length) return prev;
            const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0);
            const extra: PlayerInput[] = Array.from({ length: clamped - prev.length }, (_, i) => ({
                id: maxId + i + 1,
                displayVr: DEFAULT_DISPLAY_VR,
            }));
            return [...prev, ...extra];
        });
    };

    const updateVr = (id: number, val: number) => {
        setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, displayVr: val } : p)));
    };

    const movePlayer = (index: number, dir: -1 | 1) => {
        const next = index + dir;
        if (next < 0 || next >= playerCount()) return;
        setPlayers((prev) => {
            const arr = [...prev];
            [arr[index], arr[next]] = [arr[next], arr[index]];
            return arr;
        });
    };

    const seedDefaults = () =>
        setPlayers((prev) =>
            prev.map((p, i) => ({
                ...p,
                displayVr: i < playerCount() ? DEFAULT_DISPLAY_VR : p.displayVr,
            })),
        );
    const resetOrder = () => setPlayers((prev) => [...prev].sort((a, b) => a.id - b.id));
    const toggleExpanded = (id: number) => {
        setExpandedRows((prev) => {
            const s = new Set(prev);
            if (s.has(id)) {
                s.delete(id);
            } else {
                s.add(id);
            }
            return s;
        });
    };

    const toggleMod = (key: ToggleModifier) => setMods((m) => ({ ...m, [key]: !m[key] }));

    return (
        <>
            <PageHeader
                page="tools"
                compact
                crumbs={[{ label: "Tools", href: "/tools" }]}
                title="VR calculator"
                description="Simulate VR gains and losses using the actual game spline, caps and modifiers."
            />
            <div class="space-y-5">
                <Title>{VR_CALCULATOR_META.title}</Title>
                <Meta name="description" content={VR_CALCULATOR_META.description} />

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Race Setup */}
                    <div class="lg:col-span-2 bg-canvas rounded-lg border border-line p-4 space-y-4">
                        <h2 class="text-xs font-semibold text-fg-subtle">Race Setup</h2>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="space-y-1">
                                <span class="text-xs text-fg-subtle">Players (2–12)</span>
                                <input
                                    type="number"
                                    min="2"
                                    max="12"
                                    value={playerCount()}
                                    onInput={(e) =>
                                        changeCount(parseInt(e.currentTarget.value) || 12)
                                    }
                                    class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-line-strong bg-canvas text-fg"
                                />
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs text-fg-subtle">Min VR</span>
                                <input
                                    type="number"
                                    value={minDisplay()}
                                    onInput={(e) =>
                                        setMinDisplay(
                                            parseFloat(e.currentTarget.value) || MIN_DISPLAY_VR,
                                        )
                                    }
                                    class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-line-strong bg-canvas text-fg"
                                />
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs text-fg-subtle">Max VR</span>
                                <input
                                    type="number"
                                    value={maxDisplay()}
                                    onInput={(e) =>
                                        setMaxDisplay(
                                            parseFloat(e.currentTarget.value) || MAX_DISPLAY_VR,
                                        )
                                    }
                                    class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-line-strong bg-canvas text-fg"
                                />
                            </label>
                        </div>

                        <div class="space-y-2 pt-1 border-t border-line">
                            {[
                                { label: "VR Mode Rules", val: vrMode(), set: setVrMode },
                                { label: "All Disconnected", val: allDisc(), set: setAllDisc },
                                { label: "Reverse Mode", val: reverseMode(), set: setReverseMode },
                            ].map((opt) => (
                                <label class="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={opt.val}
                                        onChange={() => opt.set((v: boolean) => !v)}
                                        class="w-4 h-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <span class="text-sm text-fg-muted">{opt.label}</span>
                                </label>
                            ))}
                        </div>

                        <div class="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={seedDefaults}
                                class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Reset VRs
                            </button>
                            <button
                                type="button"
                                onClick={resetOrder}
                                class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Reset Order
                            </button>
                        </div>
                    </div>

                    {/* Modifiers */}
                    <div class="lg:col-span-3 bg-canvas rounded-lg border border-line p-4 space-y-4">
                        <h2 class="text-xs font-semibold text-fg-subtle">Multipliers</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TOGGLES.map((m) => (
                                <label
                                    class={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors
                                ${mods()[m.key] ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" : "bg-surface border-line hover:border-gray-300 dark:hover:border-gray-600"}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={mods()[m.key]}
                                        onChange={() => toggleMod(m.key)}
                                        class="w-4 h-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <span class="text-sm text-fg-muted flex-1">{m.label}</span>
                                    <span
                                        class={`text-xs font-mono px-1.5 py-0.5 rounded ${mods()[m.key] ? "bg-accent-soft text-accent-text" : "bg-surface text-fg-muted"}`}
                                    >
                                        {m.mult}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2.5 rounded-lg border bg-surface border-line">
                            <label class="flex items-center gap-2.5 flex-1 min-w-[10rem]">
                                <span class="text-sm text-fg-muted flex-1">Server multiplier</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.05"
                                    value={mods().serverMultiplier}
                                    onInput={(e) => {
                                        setServerEdited(true);
                                        const value = parseFloat(e.currentTarget.value);
                                        setMods((m) => ({ ...m, serverMultiplier: value }));
                                    }}
                                    class="w-20 px-2 py-1 text-sm font-mono rounded border border-line-strong bg-canvas text-fg"
                                />
                            </label>
                            <span class="text-xs text-fg-subtle">{liveStatus()}</span>
                            <Show when={serverEdited() && liveMultiplier() != null}>
                                <button
                                    type="button"
                                    onClick={() => setServerEdited(false)}
                                    class="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-fg-muted hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Use live value
                                </button>
                            </Show>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line">
                            {[
                                { label: "Base", value: `${mult().base.toFixed(2)}×` },
                                { label: "Battle Bonus", value: `+${mult().battle.toFixed(3)}` },
                                { label: "Server", value: `${mult().server.toFixed(2)}×` },
                                { label: "Total", value: `${mult().total.toFixed(2)}×` },
                            ].map((s) => (
                                <div class="bg-surface rounded-lg p-2.5 border border-line">
                                    <div class="text-xs text-fg-subtle mb-1">{s.label}</div>
                                    <div class="font-mono font-semibold text-fg text-sm">
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Show when={mult().capped}>
                            <p class="text-xs text-yellow-600 dark:text-yellow-400">
                                The game keeps the total between 1.00× and 2.50×.
                            </p>
                        </Show>

                        <Show when={reverseMode()}>
                            <AlertBox type="info">
                                <p class="text-sm">
                                    Reverse mode: enter post-race VR and the delta shown - original
                                    VR is derived.
                                </p>
                            </AlertBox>
                        </Show>
                    </div>
                </div>

                {/* Player Table */}
                <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                    <div class="px-4 py-3 border-b border-line flex items-center justify-between">
                        <h2 class="text-xs font-semibold text-fg-subtle">
                            Player Results
                            <span class="ml-2 text-fg-subtle font-normal normal-case tracking-normal">
                                row order = finish order
                            </span>
                        </h2>
                    </div>
                    <div class="relative overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-surface border-b border-line">
                                <tr>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle w-12">
                                        Pos
                                    </th>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle">
                                        Player
                                    </th>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle">
                                        {reverseMode() ? "Post VR" : "VR"}
                                    </th>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle">
                                        Move
                                    </th>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle">
                                        {reverseMode() ? "Delta (input)" : "Delta"}
                                    </th>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle">
                                        {reverseMode() ? "Original VR" : "New VR"}
                                    </th>
                                    <Show when={!reverseMode()}>
                                        <th class="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle w-8">
                                            <span class="sr-only">Position</span>
                                        </th>
                                    </Show>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                                <For each={visiblePlayers()}>
                                    {(player, pos) => {
                                        const result = () => resultFor(player.id);
                                        const isExpanded = () => expandedRows().has(player.id);

                                        const deltaDisplay = () => {
                                            const r = result();
                                            if (!r) return "";
                                            return fmtDelta(r.finalDelta);
                                        };
                                        const deltaColor = () => {
                                            const r = result();
                                            if (!r) return "";
                                            const d = Math.round(r.finalDelta * VR_DISPLAY_SCALE);
                                            if (d > 0) return "text-green-600 dark:text-green-400";
                                            if (d < 0) return "text-red-600 dark:text-red-400";
                                            return "text-gray-500";
                                        };

                                        // reverse mode delta input
                                        const [revDelta, setRevDelta] = createSignal(
                                            reverseDeltas()[pos()] ?? 0,
                                        );
                                        const revOriginal = () => player.displayVr - revDelta();

                                        return (
                                            <>
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                                    <td class="px-4 py-2 font-mono text-xs text-fg-subtle">
                                                        {pos() + 1}
                                                    </td>
                                                    <td class="px-4 py-2 font-mono text-sm font-medium text-fg-muted">
                                                        P{player.id}
                                                    </td>
                                                    <td class="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            aria-label={`VR for P${player.id}`}
                                                            value={player.displayVr}
                                                            onInput={(e) =>
                                                                updateVr(
                                                                    player.id,
                                                                    parseFloat(
                                                                        e.currentTarget.value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                            class="w-24 px-2 py-1 text-sm font-mono rounded border border-line-strong bg-canvas text-fg"
                                                        />
                                                    </td>
                                                    <td class="px-4 py-2">
                                                        <div class="flex gap-1">
                                                            <button
                                                                type="button"
                                                                aria-label={`Move P${player.id} up`}
                                                                onClick={() =>
                                                                    movePlayer(pos(), -1)
                                                                }
                                                                disabled={pos() === 0}
                                                                class="px-2 py-0.5 text-xs rounded bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                type="button"
                                                                aria-label={`Move P${player.id} down`}
                                                                onClick={() => movePlayer(pos(), 1)}
                                                                disabled={
                                                                    pos() === playerCount() - 1
                                                                }
                                                                class="px-2 py-0.5 text-xs rounded bg-surface text-fg-muted hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td
                                                        class={`px-4 py-2 font-mono text-sm font-semibold ${reverseMode() ? "" : deltaColor()}`}
                                                    >
                                                        <Show
                                                            when={reverseMode()}
                                                            fallback={<span>{deltaDisplay()}</span>}
                                                        >
                                                            <input
                                                                type="number"
                                                                aria-label={`VR change for P${player.id}`}
                                                                value={revDelta()}
                                                                onInput={(e) => {
                                                                    const v =
                                                                        parseFloat(
                                                                            e.currentTarget.value,
                                                                        ) || 0;
                                                                    setRevDelta(v);
                                                                    setReverseDeltas((prev) => {
                                                                        const a = [...prev];
                                                                        a[pos()] = v;
                                                                        return a;
                                                                    });
                                                                }}
                                                                class="w-20 px-2 py-1 text-sm font-mono rounded border border-line-strong bg-canvas text-fg"
                                                            />
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-2 font-mono text-sm font-semibold text-fg">
                                                        <Show
                                                            when={reverseMode()}
                                                            fallback={
                                                                <>
                                                                    {result()?.newDisplayVr.toLocaleString() ??
                                                                        ""}
                                                                </>
                                                            }
                                                        >
                                                            {revOriginal().toLocaleString()}
                                                        </Show>
                                                    </td>
                                                    <Show when={!reverseMode()}>
                                                        <td class="px-4 py-2">
                                                            <Show
                                                                when={
                                                                    result()?.contributions.length
                                                                }
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleExpanded(player.id)
                                                                    }
                                                                    class="text-xs px-2 py-0.5 rounded bg-surface text-fg-subtle hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                                >
                                                                    {isExpanded() ? "▲" : "▼"}
                                                                </button>
                                                            </Show>
                                                        </td>
                                                    </Show>
                                                </tr>

                                                {/* Contribution breakdown */}
                                                <Show when={isExpanded() && result()}>
                                                    <tr class="bg-gray-50/50 dark:bg-gray-900/30">
                                                        <td colspan="8" class="px-6 py-3">
                                                            <div class="text-xs font-semibold text-fg-subtle mb-2">
                                                                Pair Contributions
                                                            </div>
                                                            <table class="text-xs font-mono">
                                                                <thead>
                                                                    <tr class="text-fg-subtle">
                                                                        <th class="text-left pr-4 pb-1 font-medium">
                                                                            Opponent
                                                                        </th>
                                                                        <th class="text-left pr-4 pb-1 font-medium">
                                                                            Result
                                                                        </th>
                                                                        <th class="text-left pr-4 pb-1 font-medium">
                                                                            Raw
                                                                        </th>
                                                                        <th class="text-left pb-1 font-medium">
                                                                            ×Mult
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <For
                                                                        each={
                                                                            result()!.contributions
                                                                        }
                                                                    >
                                                                        {(c) => (
                                                                            <tr>
                                                                                <td class="pr-4 py-0.5 text-fg-muted">
                                                                                    P{c.opponentId}
                                                                                </td>
                                                                                <td
                                                                                    class={`pr-4 py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                                                >
                                                                                    {c.win
                                                                                        ? "WIN"
                                                                                        : "LOSS"}
                                                                                </td>
                                                                                <td
                                                                                    class={`pr-4 py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                                                >
                                                                                    {c.win
                                                                                        ? "+"
                                                                                        : ""}
                                                                                    {fmtFixed(
                                                                                        c.rawValue,
                                                                                    )}
                                                                                </td>
                                                                                <td
                                                                                    class={`py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                                                >
                                                                                    {c.win
                                                                                        ? "+"
                                                                                        : ""}
                                                                                    {fmtFixed(
                                                                                        c.multValue,
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </For>
                                                                </tbody>
                                                            </table>
                                                            <div class="mt-2 pt-2 border-t border-line text-fg-muted">
                                                                VR rule:{" "}
                                                                <span class="text-fg font-medium">
                                                                    {result()!.vrRule}
                                                                </span>
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
                </div>

                {/* Calc Trace */}
                <Show when={simResult()}>
                    <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setTraceOpen((v) => !v)}
                            aria-expanded={traceOpen()}
                            aria-controls="calc-trace"
                            class="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-fg-subtle hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                            <span>Calculation Trace</span>
                            <span aria-hidden="true">{traceOpen() ? "▲" : "▼"}</span>
                        </button>
                        <Show when={traceOpen()}>
                            <div
                                id="calc-trace"
                                class="relative overflow-x-auto border-t border-line"
                            >
                                <table class="w-full text-xs font-mono">
                                    <thead class="bg-surface">
                                        <tr>
                                            {[
                                                "Player",
                                                "Pair Sum",
                                                "After Mult",
                                                "After Caps",
                                                "VR Rule",
                                                "Final Δ",
                                            ].map((h) => (
                                                <th class="px-4 py-2 text-left font-semibold text-fg-subtle whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        <For each={simResult()!.players}>
                                            {(r) => (
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                    <td class="px-4 py-1.5 text-fg-muted">
                                                        P{r.id}
                                                    </td>
                                                    <td class="px-4 py-1.5 text-fg-muted">
                                                        {fmtFixed(r.pairSum)}
                                                    </td>
                                                    <td class="px-4 py-1.5 text-fg-muted">
                                                        {fmtFixed(r.afterMult)}
                                                    </td>
                                                    <td class="px-4 py-1.5 text-fg-muted">
                                                        {fmtFixed(r.afterCaps)}
                                                    </td>
                                                    <td class="px-4 py-1.5 text-gray-500">
                                                        {r.vrRule}
                                                    </td>
                                                    <td
                                                        class={`px-4 py-1.5 font-semibold ${Math.round(r.finalDelta * VR_DISPLAY_SCALE) > 0 ? "text-green-600 dark:text-green-400" : Math.round(r.finalDelta * VR_DISPLAY_SCALE) < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}
                                                    >
                                                        {fmtDelta(r.finalDelta)}
                                                    </td>
                                                </tr>
                                            )}
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
