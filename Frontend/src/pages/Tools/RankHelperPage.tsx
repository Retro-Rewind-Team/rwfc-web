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
    rankLabel,
    type RankNeeds,
    type RksysFile,
} from "../../utils/rksysParser";
import { findRatingEntry, parseRatingFile } from "../../utils/ratingParser";
import type { RatingFile } from "../../types/tools";
import { AlertBox } from "../../components/common";
import { Meta, Title } from "@solidjs/meta";
import { RANK_HELPER_META } from "../../constants/pageMeta";
import PageHeader from "../../components/common/PageHeader";
import RankGlyphs from "../../components/ui/tools/RankGlyphs";

/** Badge art cut from Retro Rewind's own font: the glyphs the game draws for ranks 1-9. */
const rankIcon = (rank: number) => `/ranks/rank-${rank}.png`;

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
                <span class="text-xs text-fg-subtle font-medium">Rank Score</span>
                <span class="text-2xl font-semibold tabular-nums text-fg">
                    {props.score.toFixed(1)}
                    <span class="text-sm font-normal text-fg-subtle">/100</span>
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
                    class="h-full rounded-full transition-colors duration-500"
                    style={{
                        width: `${pct()}%`,
                        background: "var(--accent)",
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
    const label = () => rankLabel(props.rank);
    return (
        <Show
            when={props.rank >= 1 && props.rank <= 9}
            fallback={
                <span class="inline-flex items-center rounded-lg border border-line-strong px-2.5 py-1 text-sm font-medium text-fg-subtle">
                    {label()}
                </span>
            }
        >
            <div class={`inline-flex items-center ${props.large ? "flex-col gap-1.5" : "gap-2"}`}>
                <img
                    src={rankIcon(props.rank)}
                    alt=""
                    class={props.large ? "h-16 w-auto" : "h-7 w-auto"}
                />
                <span
                    class={`font-semibold text-fg-muted ${props.large ? "text-base" : "text-sm"}`}
                >
                    {label()}
                </span>
            </div>
        </Show>
    );
}

function StatRow(props: { label: string; value: string; norm: number; max: string }) {
    return (
        <div class="space-y-1">
            <div class="flex justify-between text-xs">
                <span class="text-fg-subtle">{props.label}</span>
                <span class="font-mono text-fg-muted">
                    {props.value}
                    <span class="text-fg-subtle"> / {props.max}</span>
                </span>
            </div>
            <div class="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    class="h-full rounded-full bg-accent transition-colors duration-300"
                    style={{ width: `${Math.min(100, props.norm)}%` }}
                />
            </div>
        </div>
    );
}

function LicensePanel(props: { stats: LicenseStats; vrNote: string | null }) {
    // Memos, not plain functions: score() is read ten times in the markup below and needs() twice,
    // so each render recomputed the whole thing once per read.
    const score = createMemo((): LicenseScore => computeScore(props.stats));
    const needs = createMemo((): RankNeeds | null => computeNeeds(props.stats));

    const totalVs = () => props.stats.vsWins + props.stats.vsLosses;
    const winPct = () =>
        totalVs() > 0 ? ((100 * props.stats.vsWins) / totalVs()).toFixed(1) : "N/A";

    return (
        <div class="space-y-6">
            {/* Top row: stats + rank */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stats */}
                <div class="sm:col-span-2 bg-canvas rounded-lg border border-line p-4 space-y-3">
                    <p class="text-xs font-semibold text-fg-subtle mb-4">License Stats</p>
                    <StatRow
                        label="VR (display)"
                        value={vrDisplay(props.stats.vrPoints)}
                        norm={score().vrNorm}
                        max={(MAX_VR_INTERNAL * 100).toLocaleString()}
                    />
                    <Show when={props.vrNote}>
                        <p class="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle size={11} />
                            {props.vrNote}
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
                    <div class="pt-2 border-t border-line flex items-center gap-3 text-xs text-fg-subtle">
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
                <div class="bg-canvas rounded-lg border border-line p-4 flex flex-col items-center justify-center gap-3">
                    <p class="text-xs font-semibold text-fg-subtle">Current Rank</p>
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
                    <div class="bg-canvas rounded-lg border border-line p-6 text-center text-fg-subtle text-sm">
                        Maximum rank achieved - nothing left to improve.
                    </div>
                }
            >
                {(_) => {
                    const n = needs()!;
                    return (
                        <div class="bg-canvas rounded-lg border border-line overflow-hidden">
                            <div class="px-4 py-3 border-b border-line flex items-center justify-between">
                                <p class="text-xs font-semibold text-fg-subtle">
                                    What-If: Reach Next Rank (threshold {n.threshold})
                                </p>
                                <RankBadge rank={score().rank + 1} />
                            </div>
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-line">
                                        <th class="text-left px-4 py-2 text-xs font-medium text-fg-subtle">
                                            Stat
                                        </th>
                                        <th class="text-left px-4 py-2 text-xs font-medium text-fg-subtle">
                                            Current
                                        </th>
                                        <th class="text-left px-4 py-2 text-xs font-medium text-fg-subtle">
                                            Needed (solo)
                                        </th>
                                        <th class="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
                                    <tr>
                                        <td class="px-4 py-2.5 text-fg-muted">VR</td>
                                        <td class="px-4 py-2.5 font-mono text-fg-muted">
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
                                        <td class="px-4 py-2.5 text-fg-muted">Win Rate</td>
                                        <td class="px-4 py-2.5 font-mono text-fg-muted">
                                            {winPct()}%
                                        </td>
                                        <td
                                            class={`px-4 py-2.5 font-mono font-semibold ${feasibilityClass(n.winPct.feasibility)}`}
                                        >
                                            {n.winPct.neededRaw.toFixed(1)}%
                                            <Show when={n.winPct.extraWins !== null}>
                                                <span class="text-xs text-fg-subtle ml-1">
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
                                        <td class="px-4 py-2.5 text-fg-muted">
                                            1st-Place Finishes
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-fg-muted">
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
                                        <td class="px-4 py-2.5 text-fg-muted">Distance (km)</td>
                                        <td class="px-4 py-2.5 font-mono text-fg-muted">
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
                                        <td class="px-4 py-2.5 text-fg-muted">
                                            Distance in 1st (km)
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-fg-muted">
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
                            <div class="px-4 py-2.5 border-t border-line text-xs text-fg-subtle">
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

    const activeLicenses = () => {
        const rating = ratingData();
        return (rksysData()?.licenses ?? [])
            .map((l, i) => {
                if (!l) return null;

                // The game reads VR from the RRRating.pul slot matching this license's profile ID.
                // Slots are filled first-free, so a slot's position says nothing about the license.
                const entry = rating ? findRatingEntry(rating, l.profileId) : undefined;
                if (entry) {
                    return { l: { ...l, vrPoints: Math.round(entry.vr * 100) }, i, vrNote: null };
                }

                // Without a slot, the game seeds one from the VR stored in rksys.dat on next load.
                const vrNote = rating
                    ? "No RRRating.pul entry for this license, showing the VR from rksys.dat"
                    : "VR from rksys.dat only - load RRRating.pul for accurate values";
                return { l, i, vrNote };
            })
            .filter((x): x is { l: LicenseStats; i: number; vrNote: string | null } => x !== null);
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
        <>
            <PageHeader
                page="tools"
                compact
                crumbs={[{ label: "Tools", href: "/tools" }]}
                title="Rank helper"
                description={
                    <>
                        Load your{" "}
                        <code class="rounded-sm bg-surface px-1 font-mono text-fg">rksys.dat</code>{" "}
                        to see your license stats, rank score, and what you need to reach the next
                        rank.
                    </>
                }
                visual={<RankGlyphs />}
            />
            <div class="max-w-3xl space-y-6">
                <Title>{RANK_HELPER_META.title}</Title>
                <Meta name="description" content={RANK_HELPER_META.description} />

                {/* Upload zones */}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* rksys.dat */}
                    <div
                        class={`rounded-lg border border-dashed p-6 text-center transition-colors
                        ${
                            dragging() === "rksys"
                                ? "border-blue-500 bg-accent/5"
                                : rksysData()
                                  ? "border-green-500/60 bg-green-500/5"
                                  : fileError()
                                    ? "border-red-500/60 bg-red-500/5"
                                    : "border-line-strong hover:border-blue-400 dark:hover:border-blue-500"
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
                                            <Upload size={32} class="mx-auto mb-3 text-fg-subtle" />
                                            <p class="font-semibold text-sm text-fg-muted mb-1">
                                                1. rksys.dat
                                            </p>
                                            <p class="text-xs text-fg-subtle mb-4">
                                                <code class="font-mono">
                                                    riivolution/saves/RetroRewind6/rksys.dat
                                                </code>
                                            </p>
                                            <span class="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-lg transition-colors">
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
                                        <p class="text-xs text-fg-subtle mb-3">{fileName()}</p>
                                        <span class="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-lg transition-colors">
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
                                        <CheckCircle
                                            size={32}
                                            class="mx-auto mb-2 text-green-500"
                                        />
                                        <p class="font-semibold text-sm text-green-600 dark:text-green-400 font-mono truncate mb-0.5">
                                            {fileName()}
                                        </p>
                                        <p class="text-xs text-fg-subtle mb-2">
                                            Region: {data.region} · {activeLicenses().length}{" "}
                                            license
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
                        class={`rounded-lg border border-dashed p-6 text-center transition-colors
                        ${
                            dragging() === "pul"
                                ? "border-blue-500 bg-accent/5"
                                : ratingData()
                                  ? "border-green-500/60 bg-green-500/5"
                                  : pulError()
                                    ? "border-red-500/60 bg-red-500/5"
                                    : "border-line-strong hover:border-blue-400 dark:hover:border-blue-500"
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
                                            <Upload size={32} class="mx-auto mb-3 text-fg-subtle" />
                                            <p class="font-semibold text-sm text-fg-muted mb-1">
                                                2. RRRating.pul{" "}
                                                <span class="font-normal text-fg-subtle">
                                                    (optional)
                                                </span>
                                            </p>
                                            <p class="text-xs text-fg-subtle mb-4">
                                                <code class="font-mono">
                                                    riivolution/saves/RetroRewind6/RRRating.pul
                                                </code>
                                            </p>
                                            <span class="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-lg transition-colors">
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
                                        <p class="text-xs text-fg-subtle mb-3">{pulFileName()}</p>
                                        <span class="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-lg transition-colors">
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
                                    <p class="text-xs text-fg-subtle mb-2">VR overrides loaded</p>
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
                                <div class="flex gap-1 bg-surface rounded-lg p-1">
                                    <For each={licenses}>
                                        {({ l, i }) => (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab(i)}
                                                class={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors truncate
                                                ${
                                                    activeTab() === i
                                                        ? "bg-white dark:bg-gray-700 text-fg"
                                                        : "text-fg-muted hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                            >
                                                {l.miiName || `License ${i + 1}`}
                                            </button>
                                        )}
                                    </For>
                                </div>

                                {/* Active license content */}
                                <For each={licenses}>
                                    {({ l, i, vrNote }) => (
                                        <Show when={activeTab() === i}>
                                            <LicensePanel stats={l} vrNote={vrNote} />
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
                            "Needed (solo)" shows the minimum value for that stat alone to hit the
                            next rank threshold, assuming all other stats stay the same.
                        </li>
                        <li>
                            At least {MIN_VS_FOR_RANK} races are required before a rank is assigned.
                        </li>
                    </ul>
                </AlertBox>
            </div>
        </>
    );
}
