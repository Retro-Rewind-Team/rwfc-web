import { createMemo, createSignal, For, Show } from "solid-js";
import { AlertTriangle, CheckCircle, Upload, XCircle } from "lucide-solid";
import { validateRatingFile, validateRksysFile } from "../../utils/fileValidator";
import {
    computeNeeds,
    computeScore,
    type LicenseScore,
    type LicenseStats,
    MAX_DIST,
    MAX_DIST1ST,
    MAX_FIRSTS,
    MAX_VR_INTERNAL,
    MIN_VS_FOR_RANK,
    parseRksys,
    RANK_NAMES,
    type RankNeeds,
    type RksysFile,
} from "../../utils/rksysParser";
import { parseRatingFile } from "../../utils/ratingParser";
import type { RatingFile } from "../../types/tools";
import { AlertBox } from "../../components/common";

const RANK_COLORS = [
    "",
    "text-gray-400",
    "text-green-400",
    "text-teal-400",
    "text-cyan-400",
    "text-blue-400",
    "text-violet-400",
    "text-purple-400",
    "text-pink-400",
    "text-yellow-300",
] as const;

const RANK_BG = [
    "",
    "bg-gray-500/20 border-gray-500/40",
    "bg-green-500/20 border-green-500/40",
    "bg-teal-500/20 border-teal-500/40",
    "bg-cyan-500/20 border-cyan-500/40",
    "bg-blue-500/20 border-blue-500/40",
    "bg-violet-500/20 border-violet-500/40",
    "bg-purple-500/20 border-purple-500/40",
    "bg-pink-500/20 border-pink-500/40",
    "bg-yellow-400/20 border-yellow-400/40",
] as const;

function vrDisplay(vrPoints: number): string {
    return vrPoints.toLocaleString();
}

function fmtDist(d: number): string {
    return d.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function feasibilityClass(f: "ok" | "warn" | "infeasible"): string {
    if (f === "ok") return "text-green-400";
    if (f === "warn") return "text-yellow-400";
    return "text-red-400";
}

function feasibilityBadge(f: "ok" | "warn" | "infeasible"): string {
    if (f === "ok") return "bg-green-500/15 text-green-400 border border-green-500/30";
    if (f === "warn") return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
    return "bg-red-500/15 text-red-400 border border-red-500/30";
}

function ScoreGauge(props: { score: number; rank: number }) {
    const pct = () => Math.max(0, Math.min(100, props.score));
    const rankThresholds = [0, 24, 36, 48, 60, 72, 84, 94, 100];

    return (
        <div class="space-y-2">
            <div class="flex justify-between items-baseline">
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    Rank Score
                </span>
                <span class="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                    {props.score.toFixed(1)}
                    <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/100</span>
                </span>
            </div>
            <div class="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {rankThresholds.slice(1).map((t) => (
                    <div
                        class="absolute top-0 h-full w-px bg-gray-400/40 dark:bg-gray-500/40"
                        style={{ left: `${t}%` }}
                    />
                ))}
                <div
                    class="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${pct()}%`,
                        background:
                            props.rank >= 9
                                ? "linear-gradient(90deg, #3b82f6, #a855f7, #eab308)"
                                : props.rank >= 7
                                  ? "linear-gradient(90deg, #3b82f6, #a855f7)"
                                  : props.rank >= 4
                                    ? "linear-gradient(90deg, #3b82f6, #6366f1)"
                                    : "#3b82f6",
                    }}
                />
            </div>
            <div class="flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span>24</span>
                <span>36</span>
                <span>48</span>
                <span>60</span>
                <span>72</span>
                <span>84</span>
                <span>94</span>
                <span>100</span>
            </div>
        </div>
    );
}

function RankBadge(props: { rank: number; large?: boolean }) {
    const name = () => RANK_NAMES[props.rank] ?? "-";
    return (
        <div
            class={`inline-flex items-center justify-center border rounded-lg font-bold tabular-nums
                ${props.large ? "text-3xl px-4 py-2 min-w-[4rem]" : "text-base px-2.5 py-1 min-w-[2.5rem]"}
                ${RANK_BG[props.rank] ?? RANK_BG[1]}
                ${RANK_COLORS[props.rank] ?? RANK_COLORS[1]}`}
        >
            {name()}
        </div>
    );
}

function StatRow(props: { label: string; value: string; norm: number; max: string }) {
    return (
        <div class="space-y-1">
            <div class="flex justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">{props.label}</span>
                <span class="font-mono text-gray-700 dark:text-gray-300">
                    {props.value}
                    <span class="text-gray-400 dark:text-gray-600"> / {props.max}</span>
                </span>
            </div>
            <div class="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    class="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, props.norm)}%` }}
                />
            </div>
        </div>
    );
}

function LicensePanel(props: { stats: LicenseStats; vrWarning?: boolean }) {
    const score = (): LicenseScore => computeScore(props.stats);
    const needs = (): RankNeeds | null => computeNeeds(props.stats);

    const totalVs = () => props.stats.vsWins + props.stats.vsLosses;
    const winPct = () =>
        totalVs() > 0 ? ((100 * props.stats.vsWins) / totalVs()).toFixed(1) : "N/A";

    return (
        <div class="space-y-6">
            {/* Top row: stats + rank */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stats */}
                <div class="sm:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        License Stats
                    </p>
                    <StatRow
                        label="VR (display)"
                        value={vrDisplay(props.stats.vrPoints)}
                        norm={score().vrNorm}
                        max={(MAX_VR_INTERNAL * 100).toLocaleString()}
                    />
                    <Show when={props.vrWarning}>
                        <p class="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle size={11} />
                            VR from rksys.dat only - load RRRating.pul for accurate values
                        </p>
                    </Show>
                    <StatRow
                        label="Win Rate"
                        value={`${winPct()}%`}
                        norm={score().winPct}
                        max="100%"
                    />
                    <StatRow
                        label="1st-Place Finishes"
                        value={props.stats.firsts.toLocaleString()}
                        norm={score().firstsNorm}
                        max={MAX_FIRSTS.toLocaleString()}
                    />
                    <StatRow
                        label="Distance Driven (km)"
                        value={fmtDist(props.stats.dist)}
                        norm={score().distNorm}
                        max={MAX_DIST.toLocaleString()}
                    />
                    <StatRow
                        label="Distance in 1st (km)"
                        value={fmtDist(props.stats.dist1st)}
                        norm={score().dist1stNorm}
                        max={MAX_DIST1ST.toLocaleString()}
                    />
                    <div class="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                            {totalVs().toLocaleString()} races total (
                            {props.stats.vsWins.toLocaleString()}W /{" "}
                            {props.stats.vsLosses.toLocaleString()}L)
                        </span>
                        <Show when={!score().meetsRaceReq}>
                            <span class="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <AlertTriangle size={12} />
                                Needs {MIN_VS_FOR_RANK} races for rank
                            </span>
                        </Show>
                    </div>
                </div>

                {/* Rank card */}
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center justify-center gap-3">
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Rank
                    </p>
                    <RankBadge rank={score().rank} large />
                    <div class="w-full">
                        <ScoreGauge score={score().score} rank={score().rank} />
                    </div>
                    <Show when={!score().meetsRaceReq}>
                        <p class="text-xs text-yellow-500 text-center">
                            Score locked - play {MIN_VS_FOR_RANK - totalVs()} more races
                        </p>
                    </Show>
                </div>
            </div>

            {/* What-If table */}
            <Show
                when={needs() !== null}
                fallback={
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                        Maximum rank achieved - nothing left to improve.
                    </div>
                }
            >
                {(_) => {
                    const n = needs()!;
                    return (
                        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    What-If: Reach Next Rank (threshold {n.threshold})
                                </p>
                                <RankBadge rank={score().rank + 1} />
                            </div>
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-gray-100 dark:border-gray-700">
                                        <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Stat
                                        </th>
                                        <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Current
                                        </th>
                                        <th class="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Needed (solo)
                                        </th>
                                        <th class="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
                                    <tr>
                                        <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                            VR
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                                            {vrDisplay(props.stats.vrPoints)}
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.vr.feasibility)}`}
                                        >
                                            {n.vr.neededRaw.toLocaleString()}
                                        </td>
                                        <td class="px-4 py-2.5">
                                            <span
                                                class={`text-xs px-2 py-0.5 rounded-full ${feasibilityBadge(n.vr.feasibility)}`}
                                            >
                                                {n.vr.feasibility}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                            Win Rate
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                                            {winPct()}%
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.winPct.feasibility)}`}
                                        >
                                            {n.winPct.neededRaw.toFixed(1)}%
                                            <Show when={n.winPct.extraWins !== null}>
                                                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                    (+{n.winPct.extraWins} wins)
                                                </span>
                                            </Show>
                                        </td>
                                        <td class="px-4 py-2.5">
                                            <span
                                                class={`text-xs px-2 py-0.5 rounded-full ${feasibilityBadge(n.winPct.feasibility)}`}
                                            >
                                                {n.winPct.feasibility}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                            1st-Place Finishes
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                                            {props.stats.firsts.toLocaleString()}
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.firsts.feasibility)}`}
                                        >
                                            {n.firsts.neededRaw.toLocaleString()}
                                        </td>
                                        <td class="px-4 py-2.5">
                                            <span
                                                class={`text-xs px-2 py-0.5 rounded-full ${feasibilityBadge(n.firsts.feasibility)}`}
                                            >
                                                {n.firsts.feasibility}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                            Distance (km)
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                                            {fmtDist(props.stats.dist)}
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.dist.feasibility)}`}
                                        >
                                            {n.dist.neededRaw.toLocaleString()}
                                        </td>
                                        <td class="px-4 py-2.5">
                                            <span
                                                class={`text-xs px-2 py-0.5 rounded-full ${feasibilityBadge(n.dist.feasibility)}`}
                                            >
                                                {n.dist.feasibility}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                            Distance in 1st (km)
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                                            {fmtDist(props.stats.dist1st)}
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.dist1st.feasibility)}`}
                                        >
                                            {n.dist1st.neededRaw.toLocaleString()}
                                        </td>
                                        <td class="px-4 py-2.5">
                                            <span
                                                class={`text-xs px-2 py-0.5 rounded-full ${feasibilityBadge(n.dist1st.feasibility)}`}
                                            >
                                                {n.dist1st.feasibility}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                "Needed" values assume all other stats stay constant. Improve any
                                stat to reduce requirements on the others.
                            </div>
                        </div>
                    );
                }}
            </Show>
        </div>
    );
}

export default function RankHelperPage() {
    const [rksysData, setRksysData] = createSignal<RksysFile | null>(null);
    const [ratingData, setRatingData] = createSignal<RatingFile | null>(null);
    const [activeTab, setActiveTab] = createSignal(0);
    const [fileError, setFileError] = createSignal<string | null>(null);
    const [fileName, setFileName] = createSignal<string | null>(null);
    const [dragging, setDragging] = createSignal<"rksys" | "pul" | null>(null);
    const [pulFileName, setPulFileName] = createSignal<string | null>(null);
    const [pulError, setPulError] = createSignal<string | null>(null);

    // Map profileId -> display VR from pul file
    const vrByProfile = createMemo((): Map<number, number> => {
        const map = new Map<number, number>();
        const rating = ratingData();
        if (!rating) return map;
        for (const entry of rating.entries) {
            if (entry.profileId > 0) {
                map.set(entry.profileId, Math.round(entry.vr * 100));
            }
        }
        return map;
    });

    const activeLicenses = () => {
        const byProfile = vrByProfile();
        const rating = ratingData();
        return (rksysData()?.licenses ?? [])
            .map((l, i) => {
                if (!l) return null;

                let overrideVr: number | undefined;

                // Primary: match by profileId
                if (l.profileId > 0) {
                    overrideVr = byProfile.get(l.profileId);
                }

                // Fallback: use pul entry at same license index
                if (overrideVr === undefined && rating) {
                    const entry = rating.entries[i];
                    if (entry && entry.profileId > 0) {
                        overrideVr = Math.round(entry.vr * 100);
                    }
                }

                const stats: LicenseStats =
                    overrideVr !== undefined ? { ...l, vrPoints: overrideVr } : l;
                return { l: stats, i, vrWarning: overrideVr === undefined };
            })
            .filter((x): x is { l: LicenseStats; i: number; vrWarning: boolean } => x !== null);
    };

    async function loadRksys(file: File) {
        setFileError(null);
        setRksysData(null);
        setFileName(file.name);

        const buf = await file.arrayBuffer();
        const check = validateRksysFile(buf);
        if (!check.valid) {
            setFileError(check.error ?? "Invalid rksys.dat");
            return;
        }

        try {
            const parsed = parseRksys(buf);
            const hasAny = parsed.licenses.some((l) => l !== null);
            if (!hasAny) {
                setFileError("No license data found in this rksys.dat.");
                return;
            }
            setRksysData(parsed);
            setActiveTab(0);
        } catch (e) {
            setFileError(e instanceof Error ? e.message : String(e));
        }
    }

    async function loadPul(file: File) {
        setPulError(null);
        setRatingData(null);
        setPulFileName(file.name);

        const buf = await file.arrayBuffer();
        const check = validateRatingFile(buf);
        if (!check.valid) {
            setPulError(check.error ?? "Invalid RRRating.pul");
            return;
        }

        try {
            setRatingData(parseRatingFile(buf));
        } catch (e) {
            setPulError(e instanceof Error ? e.message : String(e));
        }
    }

    const handleRksysInput = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) loadRksys(file);
    };

    const handlePulInput = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) loadPul(file);
    };

    const handleRksysDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(null);
        const file = e.dataTransfer?.files?.[0];
        if (file) loadRksys(file);
    };

    const handlePulDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(null);
        const file = e.dataTransfer?.files?.[0];
        if (file) loadPul(file);
    };

    return (
        <div class="max-w-3xl mx-auto space-y-6">
            <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Rank Helper</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Load your{" "}
                    <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        rksys.dat
                    </code>{" "}
                    to see your license stats, rank score, and what you need to reach the next rank.
                </p>
            </div>

            {/* Upload zones */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* rksys.dat */}
                <div
                    class={`rounded-xl border-2 border-dashed p-6 text-center transition-all
                        ${
                            dragging() === "rksys"
                                ? "border-blue-500 bg-blue-500/5"
                                : rksysData()
                                  ? "border-green-500/60 bg-green-500/5"
                                  : fileError()
                                    ? "border-red-500/60 bg-red-500/5"
                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging("rksys");
                    }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={handleRksysDrop}
                >
                    <Show
                        when={rksysData()}
                        fallback={
                            <Show
                                when={fileError()}
                                fallback={
                                    <label class="cursor-pointer block">
                                        <Upload
                                            size={32}
                                            class="mx-auto mb-3 text-gray-400 dark:text-gray-500"
                                        />
                                        <p class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            1. rksys.dat
                                        </p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            <code class="font-mono">
                                                riivolution/saves/RetroRewind6/rksys.dat
                                            </code>
                                        </p>
                                        <span class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                            Choose file
                                        </span>
                                        <input
                                            type="file"
                                            accept=".dat"
                                            onChange={handleRksysInput}
                                            class="hidden"
                                        />
                                    </label>
                                }
                            >
                                <label class="cursor-pointer block">
                                    <XCircle size={32} class="mx-auto mb-3 text-red-500" />
                                    <p class="font-semibold text-sm text-red-600 dark:text-red-400 mb-1">
                                        {fileError()}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        {fileName()}
                                    </p>
                                    <span class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                        Try another file
                                    </span>
                                    <input
                                        type="file"
                                        accept=".dat"
                                        onChange={handleRksysInput}
                                        class="hidden"
                                    />
                                </label>
                            </Show>
                        }
                    >
                        {(_) => {
                            const data = rksysData()!;
                            return (
                                <label class="cursor-pointer block">
                                    <CheckCircle size={32} class="mx-auto mb-2 text-green-500" />
                                    <p class="font-semibold text-sm text-green-600 dark:text-green-400 font-mono truncate mb-0.5">
                                        {fileName()}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Region: {data.region} · {activeLicenses().length} license
                                        {activeLicenses().length !== 1 ? "s" : ""}
                                    </p>
                                    <span class="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                                        Replace file
                                    </span>
                                    <input
                                        type="file"
                                        accept=".dat"
                                        onChange={handleRksysInput}
                                        class="hidden"
                                    />
                                </label>
                            );
                        }}
                    </Show>
                </div>

                {/* RRRating.pul */}
                <div
                    class={`rounded-xl border-2 border-dashed p-6 text-center transition-all
                        ${
                            dragging() === "pul"
                                ? "border-blue-500 bg-blue-500/5"
                                : ratingData()
                                  ? "border-green-500/60 bg-green-500/5"
                                  : pulError()
                                    ? "border-red-500/60 bg-red-500/5"
                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging("pul");
                    }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={handlePulDrop}
                >
                    <Show
                        when={ratingData()}
                        fallback={
                            <Show
                                when={pulError()}
                                fallback={
                                    <label class="cursor-pointer block">
                                        <Upload
                                            size={32}
                                            class="mx-auto mb-3 text-gray-400 dark:text-gray-500"
                                        />
                                        <p class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            2. RRRating.pul{" "}
                                            <span class="font-normal text-gray-400">
                                                (optional)
                                            </span>
                                        </p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            <code class="font-mono">
                                                riivolution/saves/RetroRewind6/RRRating.pul
                                            </code>
                                        </p>
                                        <span class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                            Choose file
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pul"
                                            onChange={handlePulInput}
                                            class="hidden"
                                        />
                                    </label>
                                }
                            >
                                <label class="cursor-pointer block">
                                    <XCircle size={32} class="mx-auto mb-3 text-red-500" />
                                    <p class="font-semibold text-sm text-red-600 dark:text-red-400 mb-1">
                                        {pulError()}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        {pulFileName()}
                                    </p>
                                    <span class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                        Try another file
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pul"
                                        onChange={handlePulInput}
                                        class="hidden"
                                    />
                                </label>
                            </Show>
                        }
                    >
                        {(_) => (
                            <label class="cursor-pointer block">
                                <CheckCircle size={32} class="mx-auto mb-2 text-green-500" />
                                <p class="font-semibold text-sm text-green-600 dark:text-green-400 font-mono truncate mb-0.5">
                                    {pulFileName()}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    VR overrides loaded
                                </p>
                                <span class="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                                    Replace file
                                </span>
                                <input
                                    type="file"
                                    accept=".pul"
                                    onChange={handlePulInput}
                                    class="hidden"
                                />
                            </label>
                        )}
                    </Show>
                </div>
            </div>

            {/* License tabs + content */}
            <Show when={rksysData() !== null}>
                {(_) => {
                    const licenses = activeLicenses();
                    return (
                        <div class="space-y-4">
                            {/* Tabs */}
                            <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                <For each={licenses}>
                                    {({ l, i }) => (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab(i)}
                                            class={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors truncate
                                                ${
                                                    activeTab() === i
                                                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            {l.miiName || `License ${i + 1}`}
                                        </button>
                                    )}
                                </For>
                            </div>

                            {/* Active license content */}
                            <For each={licenses}>
                                {({ l, i, vrWarning }) => (
                                    <Show when={activeTab() === i}>
                                        <LicensePanel stats={l} vrWarning={vrWarning} />
                                    </Show>
                                )}
                            </For>
                        </div>
                    );
                }}
            </Show>

            <AlertBox type="info" title="Notes">
                <ul class="space-y-1 text-sm list-disc list-inside">
                    <li>
                        The rank score formula weights VR heavily (60%), with win rate, 1st
                        finishes, and distance making up the rest.
                    </li>
                    <li>
                        "Needed (solo)" shows the minimum value for that stat alone to hit the next
                        rank threshold, assuming all other stats stay the same.
                    </li>
                    <li>
                        At least {MIN_VS_FOR_RANK} races are required before a rank is assigned.
                    </li>
                </ul>
            </AlertBox>
        </div>
    );
}
