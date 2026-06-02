import { createEffect, createSignal, For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { ChartBarBig, TrendingUp, TriangleAlert } from "lucide-solid";
import { queryKeys } from "../../../constants/queryKeys";
import { roomStatusApi } from "../../../services/api";
import { PlayerCountDataPoint } from "../../../types/room";

const TIME_OPTIONS: { label: string; days: number | undefined }[] = [
    { label: "24h", days: 1 },
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "All time", days: undefined },
];

const DOTS_THRESHOLD = 60;
const CHART_HEIGHT = 300;
const CHART_WIDTH = 800;
// PAD is now a function — bottom grows for "All time" to fit DD-MM-YYYY labels

export default function ServerActivityChart() {
    const [selectedDays, setSelectedDays] = createSignal<number | undefined>(7);
    const [hoveredPoint, setHoveredPoint] = createSignal<PlayerCountDataPoint | null>(null);
    const [hoveredPos, setHoveredPos] = createSignal<{ x: number; y: number } | null>(null);
    let svgRef: SVGSVGElement | undefined;

    const getPad = () => ({
        top: 20,
        right: 20,
        bottom: selectedDays() === undefined ? 70 : 50,
        left: 60,
    });

    const chartId = Math.random().toString(36).slice(2, 8);

    createEffect(() => {
        selectedDays();
        setHoveredPoint(null);
        setHoveredPos(null);
    });

    const seriesQuery = useQuery(() => ({
        queryKey: queryKeys.roomPlayerCountSeries(selectedDays()),
        queryFn: () => roomStatusApi.getPlayerCountSeries(selectedDays()),
        staleTime: 2 * 60 * 1000,
    }));

    const statsQuery = useQuery(() => ({
        queryKey: queryKeys.roomStats,
        queryFn: () => roomStatusApi.getStats(),
        staleTime: 30 * 1000,
    }));

    const data = () => seriesQuery.data ?? [];

    const getScales = () => {
        const pts = data();
        if (pts.length === 0) return { minP: 0, maxP: 10, range: 10 };
        const values = pts.map((p) => p.players);
        let min = Math.min(...values);
        let max = Math.max(...values);
        if (min === max) {
            min = Math.max(0, min - 5);
            max = max + 5;
        }
        return { minP: min, maxP: max, range: max - min };
    };

    const pointToSVG = (point: PlayerCountDataPoint) => {
        const pts = data();
        const { minP, range } = getScales();
        const innerW = CHART_WIDTH - getPad().left - getPad().right;
        const innerH = CHART_HEIGHT - getPad().top - getPad().bottom;
        const times = pts.map((p) => new Date(p.timestamp).getTime());
        const minT = times[0];
        const maxT = times[times.length - 1];
        const tRange = maxT - minT || 1;
        const t = new Date(point.timestamp).getTime();
        const x = getPad().left + ((t - minT) / tRange) * innerW;
        const y = getPad().top + innerH - ((point.players - minP) / range) * innerH;
        return { x, y };
    };

    const snapToNearest = (clientX: number) => {
        const pts = data();
        if (pts.length === 0 || !svgRef) return;
        const innerW = CHART_WIDTH - getPad().left - getPad().right;
        const rect = svgRef.getBoundingClientRect();
        const mouseX = (clientX - rect.left) * (CHART_WIDTH / rect.width);
        const times = pts.map((p) => new Date(p.timestamp).getTime());
        const minT = times[0];
        const maxT = times[times.length - 1];
        const tRange = maxT - minT || 1;
        const toX = (i: number) => getPad().left + ((times[i] - minT) / tRange) * innerW;
        let lo = 0,
            hi = pts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (toX(mid) < mouseX) lo = mid + 1;
            else hi = mid;
        }
        if (lo > 0 && Math.abs(toX(lo - 1) - mouseX) < Math.abs(toX(lo) - mouseX)) lo--;
        setHoveredPoint(pts[lo]);
        setHoveredPos(pointToSVG(pts[lo]));
    };

    const generatePath = () => {
        const pts = data();
        if (pts.length === 0) return "";
        const { x, y } = pointToSVG(pts[0]);
        let path = `M ${x} ${y}`;
        for (let i = 1; i < pts.length; i++) {
            const { x: px, y: py } = pointToSVG(pts[i]);
            path += ` L ${px} ${py}`;
        }
        return path;
    };

    const generateAreaPath = () => {
        const pts = data();
        if (pts.length === 0) return "";
        const bottomY = getPad().top + CHART_HEIGHT - getPad().top - getPad().bottom;
        const first = pointToSVG(pts[0]);
        let path = `M ${first.x} ${bottomY} L ${first.x} ${first.y}`;
        for (let i = 1; i < pts.length; i++) {
            const { x, y } = pointToSVG(pts[i]);
            path += ` L ${x} ${y}`;
        }
        const last = pointToSVG(pts[pts.length - 1]);
        path += ` L ${last.x} ${bottomY} Z`;
        return path;
    };

    const getYTicks = () => {
        const { minP, maxP } = getScales();
        const innerH = CHART_HEIGHT - getPad().top - getPad().bottom;
        return [
            { value: minP, y: getPad().top + innerH },
            { value: maxP, y: getPad().top },
        ];
    };

    const getXTicks = () => {
        const pts = data();
        if (pts.length < 2) return [];
        const first = pointToSVG(pts[0]);
        const last = pointToSVG(pts[pts.length - 1]);
        const days = selectedDays();
        const fmt = (ts: string) => {
            const d = new Date(ts);
            const dd = String(d.getDate()).padStart(2, "0");
            const mo = String(d.getMonth() + 1).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            if (days === 1) return `${hh}:${mm}`;
            if (!days) return `${dd}-${mo}-${d.getFullYear()}`;
            return `${dd}/${mo}`;
        };
        return [
            { label: fmt(pts[0].timestamp), x: first.x },
            { label: fmt(pts[pts.length - 1].timestamp), x: last.x },
        ];
    };

    const formatTooltipTime = (ts: string) => {
        const d = new Date(ts);
        const dd = String(d.getDate()).padStart(2, "0");
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const days = selectedDays();
        if (days === 1) return `${hh}:${mm}`;
        if (!days) return `${dd}-${mo}-${d.getFullYear()} ${hh}:${mm}`;
        return `${dd}/${mo} ${hh}:${mm}`;
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div class="flex items-center gap-2">
                    <TrendingUp size={20} class="text-blue-500 dark:text-blue-400" />
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Server Activity</h2>
                </div>
                <div class="flex gap-1">
                    <For each={TIME_OPTIONS}>
                        {(opt) => (
                            <button
                                type="button"
                                onClick={() => setSelectedDays(opt.days)}
                                class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedDays() === opt.days
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {opt.label}
                            </button>
                        )}
                    </For>
                </div>
            </div>

            {/* Stat pills */}
            <Show when={statsQuery.data}>
                {(stats) => (
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700">
                            <div class="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats().totalPlayers}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                Current
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700">
                            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {stats().peakPlayersToday}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                Peak Today
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700">
                            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {stats().peakPlayersAllTime}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                All-Time Peak
                            </div>
                        </div>
                    </div>
                )}
            </Show>

            {/* Loading */}
            <Show when={seriesQuery.isLoading}>
                <div class="h-64 flex items-center justify-center gap-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p class="text-gray-600 dark:text-gray-300 text-sm">Loading activity data...</p>
                </div>
            </Show>

            {/* Error */}
            <Show when={seriesQuery.isError && !seriesQuery.isLoading}>
                <div class="h-64 flex items-center justify-center">
                    <div class="text-center">
                        <div class="flex justify-center mb-3 text-red-400">
                            <TriangleAlert size={40} />
                        </div>
                        <p class="text-red-600 dark:text-red-400 font-medium mb-3">
                            Failed to load activity data
                        </p>
                        <button
                            type="button"
                            onClick={() => seriesQuery.refetch()}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Empty */}
            <Show when={!seriesQuery.isLoading && !seriesQuery.isError && data().length === 0}>
                <div class="h-64 flex items-center justify-center">
                    <div class="text-center">
                        <div class="flex justify-center mb-3 text-gray-300 dark:text-gray-600">
                            <ChartBarBig size={40} />
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">
                            No data available for this period
                        </p>
                    </div>
                </div>
            </Show>

            {/* Chart */}
            <Show when={!seriesQuery.isLoading && !seriesQuery.isError && data().length > 0}>
                <div
                    class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                    onClick={() => {
                        setHoveredPoint(null);
                        setHoveredPos(null);
                    }}
                >
                    <svg
                        ref={(el) => (svgRef = el)}
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        class="w-full h-auto cursor-crosshair"
                        preserveAspectRatio="xMidYMid meet"
                        onMouseMove={(e) => snapToNearest(e.clientX)}
                        onMouseLeave={() => {
                            setHoveredPoint(null);
                            setHoveredPos(null);
                        }}
                    >
                        <defs>
                            <linearGradient id={`serverLineGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#3B82F6" />
                                <stop offset="100%" stop-color="#8B5CF6" />
                            </linearGradient>
                            <linearGradient id={`serverAreaGrad-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25" />
                                <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.02" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <For each={getYTicks()}>
                            {(tick) => (
                                <line
                                    x1={getPad().left}
                                    y1={tick.y}
                                    x2={CHART_WIDTH - getPad().right}
                                    y2={tick.y}
                                    stroke="currentColor"
                                    class="text-gray-300 dark:text-gray-600"
                                    stroke-width="1"
                                    stroke-dasharray="4,4"
                                />
                            )}
                        </For>

                        {/* Y-axis */}
                        <line
                            x1={getPad().left}
                            y1={getPad().top}
                            x2={getPad().left}
                            y2={CHART_HEIGHT - getPad().bottom}
                            stroke="currentColor"
                            class="text-gray-400 dark:text-gray-600"
                            stroke-width="2"
                        />

                        {/* X-axis */}
                        <line
                            x1={getPad().left}
                            y1={CHART_HEIGHT - getPad().bottom}
                            x2={CHART_WIDTH - getPad().right}
                            y2={CHART_HEIGHT - getPad().bottom}
                            stroke="currentColor"
                            class="text-gray-400 dark:text-gray-600"
                            stroke-width="2"
                        />

                        {/* Area fill */}
                        <path d={generateAreaPath()} fill={`url(#serverAreaGrad-${chartId})`} />

                        {/* Line */}
                        <path
                            d={generatePath()}
                            fill="none"
                            stroke={`url(#serverLineGrad-${chartId})`}
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />

                        {/* Y-axis labels */}
                        <For each={getYTicks()}>
                            {(tick) => (
                                <text
                                    x={getPad().left - 8}
                                    y={tick.y + 4}
                                    text-anchor="end"
                                    class="text-xs fill-gray-600 dark:fill-gray-400"
                                    font-family="monospace"
                                >
                                    {tick.value}
                                </text>
                            )}
                        </For>

                        {/* X-axis labels */}
                        <For each={getXTicks()}>
                            {(tick) => (
                                <text
                                    x={tick.x}
                                    y={CHART_HEIGHT - getPad().bottom + 18}
                                    text-anchor="middle"
                                    class="text-xs fill-gray-600 dark:fill-gray-400"
                                >
                                    {tick.label}
                                </text>
                            )}
                        </For>

                        {/* Dots for sparse datasets */}
                        <Show when={data().length <= DOTS_THRESHOLD}>
                            <For each={data()}>
                                {(point) => {
                                    const { x, y } = pointToSVG(point);
                                    return (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="white"
                                            stroke={`url(#serverLineGrad-${chartId})`}
                                            stroke-width="2"
                                            style="pointer-events: none"
                                        />
                                    );
                                }}
                            </For>
                        </Show>

                        {/* Crosshair */}
                        <Show when={hoveredPoint() && hoveredPos()}>
                            <line
                                x1={hoveredPos()!.x}
                                y1={getPad().top}
                                x2={hoveredPos()!.x}
                                y2={CHART_HEIGHT - getPad().bottom}
                                stroke="currentColor"
                                class="text-gray-400 dark:text-gray-500"
                                stroke-width="1"
                                stroke-dasharray="4,4"
                                style="pointer-events: none"
                            />
                            <circle
                                cx={hoveredPos()!.x}
                                cy={hoveredPos()!.y}
                                r="5"
                                fill="white"
                                stroke={`url(#serverLineGrad-${chartId})`}
                                stroke-width="2"
                                style="pointer-events: none"
                            />
                        </Show>

                        {/* Tooltip */}
                        <Show when={hoveredPoint() && hoveredPos()}>
                            {(() => {
                                const pt = hoveredPoint()!;
                                const pos = hoveredPos()!;
                                const W = 140;
                                const H = 58;
                                let tx =
                                    pos.x > CHART_WIDTH / 2 ? pos.x - W - 10 : pos.x + 10;
                                if (tx < getPad().left) tx = getPad().left;
                                if (tx + W > CHART_WIDTH - getPad().right)
                                    tx = CHART_WIDTH - getPad().right - W;
                                let ty = pos.y - H - 10;
                                if (ty < getPad().top) ty = pos.y + 15;

                                return (
                                    <g style="pointer-events: none">
                                        <rect
                                            x={tx}
                                            y={ty}
                                            width={W}
                                            height={H}
                                            rx="6"
                                            fill="white"
                                            stroke="#E5E7EB"
                                            stroke-width="2"
                                            class="dark:fill-gray-800 dark:stroke-gray-600"
                                        />
                                        <text
                                            x={tx + W / 2}
                                            y={ty + 16}
                                            text-anchor="middle"
                                            class="text-xs fill-gray-500 dark:fill-gray-400"
                                        >
                                            {formatTooltipTime(pt.timestamp)}
                                        </text>
                                        <text
                                            x={tx + W / 2}
                                            y={ty + 34}
                                            text-anchor="middle"
                                            class="text-sm fill-gray-900 dark:fill-white font-bold"
                                        >
                                            {pt.players} players
                                        </text>
                                        <text
                                            x={tx + W / 2}
                                            y={ty + 50}
                                            text-anchor="middle"
                                            class="text-xs fill-gray-500 dark:fill-gray-400"
                                        >
                                            {pt.rooms} rooms
                                        </text>
                                    </g>
                                );
                            })()}
                        </Show>
                    </svg>
                </div>
            </Show>
        </div>
    );
}
