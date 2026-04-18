import { createMemo, createSignal, For, Show } from "solid-js";
import {
    DEFAULT_DISPLAY_VR,
    DEFAULT_MODIFIERS,
    fmtDelta,
    fmtFixed,
    getMultiplier,
    type MultiplierInfo,
    type PlayerInput,
    type PlayerResult,
    simulate,
    type SimulationResult,
    VR_DISPLAY_SCALE,
    type VRModifiers,
} from "../../utils/vrCalculator";
import { AlertBox } from "../../components/common";

const PLAYER_LIMIT = { min: 2, max: 12 };

function makeDefaultPlayers(count: number): PlayerInput[] {
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, displayVr: DEFAULT_DISPLAY_VR }));
}

export default function VRCalculatorPage() {
    const [players, setPlayers] = createSignal<PlayerInput[]>(makeDefaultPlayers(12));
    const [playerCount, setPlayerCount] = createSignal(12);
    const [mods, setMods] = createSignal<VRModifiers>(DEFAULT_MODIFIERS);
    const [vrMode, setVrMode] = createSignal(true);
    const [allDisc, setAllDisc] = createSignal(false);
    const [minDisplay, setMinDisplay] = createSignal(1);
    const [maxDisplay, setMaxDisplay] = createSignal(1_000_000);
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

    const toggleMod = (key: keyof VRModifiers) => setMods((m) => ({ ...m, [key]: !m[key] }));

    const MODIFIERS: { key: keyof VRModifiers; label: string; mult: string }[] = [
        { key: "eventDay", label: "Event Day", mult: "2.0×" },
        { key: "specialMultiplier", label: "Special", mult: "1.25×" },
        { key: "weekendMultiplier", label: "Weekend", mult: "1.25×" },
        { key: "battleBonus", label: "Battle Bonus", mult: "count" },
        { key: "betaBuild", label: "Beta Build", mult: "1.15×" },
    ];

    return (
        <div class="max-w-6xl mx-auto space-y-5">
            <div class="border-b border-gray-200 dark:border-gray-700 pb-5">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">VR Calculator</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Simulate VR gains and losses using the actual game spline, caps, and modifiers.
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Race Setup */}
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Race Setup
                    </h2>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="space-y-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                Players (2–12)
                            </span>
                            <input
                                type="number"
                                min="2"
                                max="12"
                                value={playerCount()}
                                onInput={(e) => changeCount(parseInt(e.currentTarget.value) || 12)}
                                class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                            />
                        </label>
                        <label class="space-y-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">Min VR</span>
                            <input
                                type="number"
                                value={minDisplay()}
                                onInput={(e) =>
                                    setMinDisplay(parseFloat(e.currentTarget.value) || 1)
                                }
                                class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                            />
                        </label>
                        <label class="space-y-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">Max VR</span>
                            <input
                                type="number"
                                value={maxDisplay()}
                                onInput={(e) =>
                                    setMaxDisplay(parseFloat(e.currentTarget.value) || 1_000_000)
                                }
                                class="w-full px-2 py-1.5 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                            />
                        </label>
                    </div>

                    <div class="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-700">
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
                                <span class="text-sm text-gray-700 dark:text-gray-300">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div class="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={seedDefaults}
                            class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Reset VRs
                        </button>
                        <button
                            type="button"
                            onClick={resetOrder}
                            class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Reset Order
                        </button>
                    </div>
                </div>

                {/* Modifiers */}
                <div class="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Multipliers
                    </h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MODIFIERS.map((m) => (
                            <label
                                class={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors
                                ${mods()[m.key] ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={mods()[m.key]}
                                    onChange={() => toggleMod(m.key)}
                                    class="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span class="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                    {m.label}
                                </span>
                                <span
                                    class={`text-xs font-mono px-1.5 py-0.5 rounded ${mods()[m.key] ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}
                                >
                                    {m.mult}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div class="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {[
                            { label: "Base", value: mult().base.toFixed(2) },
                            { label: "Battle Bonus", value: mult().battle.toFixed(2) },
                            { label: "Total", value: mult().total.toFixed(2) },
                        ].map((s) => (
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {s.label}
                                </div>
                                <div class="font-mono font-semibold text-gray-900 dark:text-white text-sm">
                                    {s.value}×
                                </div>
                            </div>
                        ))}
                    </div>

                    <Show when={reverseMode()}>
                        <AlertBox type="info">
                            <p class="text-sm">
                                Reverse mode: enter post-race VR and the delta shown - original VR
                                is derived.
                            </p>
                        </AlertBox>
                    </Show>
                </div>
            </div>

            {/* Player Table */}
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Player Results
                        <span class="ml-2 text-gray-400 dark:text-gray-600 font-normal normal-case tracking-normal">
                            row order = finish order
                        </span>
                    </h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">
                                    Pos
                                </th>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Player
                                </th>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {reverseMode() ? "Post VR" : "VR"}
                                </th>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Move
                                </th>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {reverseMode() ? "Delta (input)" : "Delta"}
                                </th>
                                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {reverseMode() ? "Original VR" : "New VR"}
                                </th>
                                <Show when={!reverseMode()}>
                                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-8"></th>
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
                                        if (d < 0) return "text-red-500 dark:text-red-400";
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
                                                <td class="px-4 py-2 font-mono text-xs text-gray-400">
                                                    {pos() + 1}
                                                </td>
                                                <td class="px-4 py-2 font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    P{player.id}
                                                </td>
                                                <td class="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={player.displayVr}
                                                        onInput={(e) =>
                                                            updateVr(
                                                                player.id,
                                                                parseFloat(e.currentTarget.value) ||
                                                                    0,
                                                            )
                                                        }
                                                        class="w-24 px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td class="px-4 py-2">
                                                    <div class="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => movePlayer(pos(), -1)}
                                                            disabled={pos() === 0}
                                                            class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => movePlayer(pos(), 1)}
                                                            disabled={pos() === playerCount() - 1}
                                                            class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
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
                                                            class="w-20 px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </Show>
                                                </td>
                                                <td class="px-4 py-2 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
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
                                                        <Show when={result()?.contributions.length}>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleExpanded(player.id)
                                                                }
                                                                class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                                                        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                            Pair Contributions
                                                        </div>
                                                        <table class="text-xs font-mono">
                                                            <thead>
                                                                <tr class="text-gray-400 dark:text-gray-500">
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
                                                                <For each={result()!.contributions}>
                                                                    {(c) => (
                                                                        <tr>
                                                                            <td class="pr-4 py-0.5 text-gray-600 dark:text-gray-400">
                                                                                P{c.opponentId}
                                                                            </td>
                                                                            <td
                                                                                class={`pr-4 py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                                                                            >
                                                                                {c.win
                                                                                    ? "WIN"
                                                                                    : "LOSS"}
                                                                            </td>
                                                                            <td
                                                                                class={`pr-4 py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                                                                            >
                                                                                {c.win ? "+" : ""}
                                                                                {fmtFixed(
                                                                                    c.rawValue,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                class={`py-0.5 ${c.win ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                                                                            >
                                                                                {c.win ? "+" : ""}
                                                                                {fmtFixed(
                                                                                    c.multValue,
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </For>
                                                            </tbody>
                                                        </table>
                                                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                                            VR rule:{" "}
                                                            <span class="text-gray-800 dark:text-gray-200 font-medium">
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
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setTraceOpen((v) => !v)}
                        class="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                        <span>Calculation Trace</span>
                        <span>{traceOpen() ? "▲" : "▼"}</span>
                    </button>
                    <Show when={traceOpen()}>
                        <div class="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
                            <table class="w-full text-xs font-mono">
                                <thead class="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        {[
                                            "Player",
                                            "Pair Sum",
                                            "After Mult",
                                            "After Caps",
                                            "VR Rule",
                                            "Final Δ",
                                        ].map((h) => (
                                            <th class="px-4 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    <For each={simResult()!.players}>
                                        {(r) => (
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                <td class="px-4 py-1.5 text-gray-700 dark:text-gray-300">
                                                    P{r.id}
                                                </td>
                                                <td class="px-4 py-1.5 text-gray-600 dark:text-gray-400">
                                                    {fmtFixed(r.pairSum)}
                                                </td>
                                                <td class="px-4 py-1.5 text-gray-600 dark:text-gray-400">
                                                    {fmtFixed(r.afterMult)}
                                                </td>
                                                <td class="px-4 py-1.5 text-gray-600 dark:text-gray-400">
                                                    {fmtFixed(r.afterCaps)}
                                                </td>
                                                <td class="px-4 py-1.5 text-gray-500">
                                                    {r.vrRule}
                                                </td>
                                                <td
                                                    class={`px-4 py-1.5 font-semibold ${Math.round(r.finalDelta * VR_DISPLAY_SCALE) > 0 ? "text-green-600 dark:text-green-400" : Math.round(r.finalDelta * VR_DISPLAY_SCALE) < 0 ? "text-red-500 dark:text-red-400" : "text-gray-500"}`}
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
    );
}
