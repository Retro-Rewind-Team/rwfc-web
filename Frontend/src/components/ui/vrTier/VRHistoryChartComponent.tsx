import { createSignal, For, Show } from "solid-js";
import { ProcessedVRHistory, useVRHistory } from "../../../hooks/useVRHistory";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import ChartBarBig from "lucide-solid/icons/chart-bar-big";
import { Info } from "lucide-solid/icons/index";

interface VRHistoryChartProps {
    readonly friendCode: string;
    readonly initialDays?: number;
}

// Below this point count, render individual dots for each data point.
// Above it, just the line is shown (plus the hovered dot) to avoid visual clutter.
const DOTS_THRESHOLD = 60;

export default function VRHistoryChart(props: VRHistoryChartProps) {
    const {
        historyData,
        stats,
        selectedDays,
        customRange,
        isLoading,
        error,
        changePeriod,
        changeRange,
        refresh,
    } = useVRHistory(props.friendCode, props.initialDays);

    const [hoveredPoint, setHoveredPoint] = createSignal<ProcessedVRHistory | null>(null);
    const [showCustomRange, setShowCustomRange] = createSignal(false);
    const [rangeFrom, setRangeFrom] = createSignal("");
    const [rangeTo, setRangeTo] = createSignal("");
    const [hoveredPosition, setHoveredPosition] = createSignal<{
        x: number;
        y: number;
    } | null>(null);

    let svgRef: SVGSVGElement;

    // Detect mobile
    const isMobile = () => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < 768 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    };

    // The intended period width in days, used for all date formatting so it works
    // correctly for both preset periods and arbitrary custom date ranges.
    // Presets and custom ranges use the requested window, not the data span, so a
    // player who only played on one day within a 7d window still gets dd/mm labels.
    // Lifetime falls back to the data span since there is no fixed window.
    const displayRangeDays = () => {
        const range = customRange();
        if (range) {
            return (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24);
        }
        const days = selectedDays();
        if (days !== null) return days;
        // Lifetime: derive from actual data extent, but always show date labels
        // hour-only labels are meaningless without a date when viewing all-time history.
        const data = historyData();
        if (data.length < 2) return 365;
        const span =
            (new Date(data[data.length - 1].date).getTime() - new Date(data[0].date).getTime()) /
            (1000 * 60 * 60 * 24);
        return Math.max(span, 2);
    };

    const todayString = () => new Date().toISOString().slice(0, 10);

    const handleApplyRange = () => {
        const fromStr = rangeFrom();
        const toStr = rangeTo();
        if (!fromStr || !toStr) return;

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let from = new Date(fromStr);
        let to = new Date(toStr);
        to.setHours(23, 59, 59, 999);

        // Clamp to today
        if (to > today) to = today;
        // Can't start in the future
        if (from > today)
            from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        // Ensure from <= to (swap if not)
        if (from > to) [from, to] = [to, from];

        // Update inputs to reflect any clamping
        setRangeFrom(from.toISOString().slice(0, 10));
        setRangeTo(to.toISOString().slice(0, 10));

        changeRange(from, to);
    };

    // Chart dimensions
    const CHART_HEIGHT = 400;
    const CHART_WIDTH = 800;

    // Dynamic padding based on selected period
    const getPadding = () => {
        return {
            top: 20,
            right: 20,
            bottom: displayRangeDays() > 30 ? 80 : 60,
            left: 80,
        };
    };

    // Calculate scales
    const getScales = () => {
        const data = historyData();
        if (data.length === 0) {
            return { minVR: 0, maxVR: 10000, vrRange: 10000 };
        }

        const allVRValues = data.map((d) => d.totalVR);
        let minVR = Math.min(...allVRValues);
        let maxVR = Math.max(...allVRValues);

        // If min and max are the same (flat line), add padding to center the line
        if (minVR === maxVR) {
            const padding = Math.max(maxVR * 0.1, 500); // 10% of VR or minimum 500
            minVR = minVR - padding;
            maxVR = maxVR + padding;
        }

        const vrRange = maxVR - minVR;

        return { minVR, maxVR, vrRange };
    };

    // Convert data point to SVG coordinates based on time
    const pointToSVG = (point: ProcessedVRHistory) => {
        const scales = getScales();
        const data = historyData();
        const padding = getPadding();
        const innerWidth = CHART_WIDTH - padding.left - padding.right;
        const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;

        // Calculate X position based on time
        const pointTime = new Date(point.date).getTime();
        const firstTime = new Date(data[0].date).getTime();
        const lastTime = new Date(data[data.length - 1].date).getTime();
        const timeRange = lastTime - firstTime || 1; // Prevent division by zero

        const timeProgress = (pointTime - firstTime) / timeRange;
        const x = padding.left + timeProgress * innerWidth;

        // Calculate Y position based on VR
        const y =
            padding.top +
            innerHeight -
            ((point.totalVR - scales.minVR) / scales.vrRange) * innerHeight;

        return { x, y };
    };

    // Find and highlight the nearest data point to the cursor's X position.
    // Uses binary search since data is time-sorted (X values monotonically increase).
    const snapToNearest = (clientX: number) => {
        const data = historyData();
        if (data.length === 0 || !svgRef) return;

        const padding = getPadding();
        const innerWidth = CHART_WIDTH - padding.left - padding.right;
        const svgRect = svgRef.getBoundingClientRect();
        const mouseX = (clientX - svgRect.left) * (CHART_WIDTH / svgRect.width);

        const firstTime = new Date(data[0].date).getTime();
        const lastTime = new Date(data[data.length - 1].date).getTime();
        const timeRange = lastTime - firstTime || 1;

        const toX = (i: number) => {
            const t = new Date(data[i].date).getTime();
            return padding.left + ((t - firstTime) / timeRange) * innerWidth;
        };

        let lo = 0,
            hi = data.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (toX(mid) < mouseX) lo = mid + 1;
            else hi = mid;
        }

        // Check if the point just before lo is closer
        if (lo > 0 && Math.abs(toX(lo - 1) - mouseX) < Math.abs(toX(lo) - mouseX)) {
            lo--;
        }

        const nearest = data[lo];
        setHoveredPoint(nearest);
        setHoveredPosition(pointToSVG(nearest));
    };

    const handleSVGMouseMove = (e: MouseEvent) => {
        if (isMobile()) return;
        snapToNearest(e.clientX);
    };

    const handleSVGTouchStart = (e: TouchEvent) => {
        e.stopPropagation(); // Prevent outer div from clearing the tooltip
        snapToNearest(e.touches[0].clientX);
    };

    const handleMouseLeave = () => {
        if (!isMobile()) {
            setHoveredPoint(null);
            setHoveredPosition(null);
        }
    };

    const handleTapOutside = () => {
        if (isMobile()) {
            setHoveredPoint(null);
            setHoveredPosition(null);
        }
    };

    // Generate Y-axis ticks
    const getYAxisTicks = () => {
        const scales = getScales();
        const padding = getPadding();
        const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;
        return [
            { value: scales.minVR, y: padding.top + innerHeight },
            { value: scales.maxVR, y: padding.top },
        ];
    };

    // Generate X-axis ticks
    const getXAxisTicks = () => {
        const data = historyData();

        if (data.length === 0) return [];

        const firstDate = new Date(data[0].date);
        const lastDate = new Date(data[data.length - 1].date);
        const firstPoint = pointToSVG(data[0]);
        const lastPoint = pointToSVG(data[data.length - 1]);

        const rangeDays = displayRangeDays();

        if (rangeDays <= 1) {
            // Sub-day - show time only
            const firstLabel = `${String(firstDate.getHours()).padStart(2, "0")}:${String(firstDate.getMinutes()).padStart(2, "0")}`;
            const lastLabel = `${String(lastDate.getHours()).padStart(2, "0")}:${String(lastDate.getMinutes()).padStart(2, "0")}`;

            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x },
            ];
        } else if (rangeDays > 30) {
            // Longer ranges - include the year
            const firstLabel = `${String(firstDate.getDate()).padStart(2, "0")}-${String(firstDate.getMonth() + 1).padStart(2, "0")}-${firstDate.getFullYear()}`;
            const lastLabel = `${String(lastDate.getDate()).padStart(2, "0")}-${String(lastDate.getMonth() + 1).padStart(2, "0")}-${lastDate.getFullYear()}`;

            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x },
            ];
        } else {
            // Short ranges - dd/mm is sufficient
            const firstLabel = `${String(firstDate.getDate()).padStart(2, "0")}/${String(firstDate.getMonth() + 1).padStart(2, "0")}`;
            const lastLabel = `${String(lastDate.getDate()).padStart(2, "0")}/${String(lastDate.getMonth() + 1).padStart(2, "0")}`;

            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x },
            ];
        }
    };

    // Generate SVG path
    const generatePath = () => {
        const data = historyData();
        if (data.length === 0) return "";

        const firstPoint = pointToSVG(data[0]);
        let path = `M ${firstPoint.x} ${firstPoint.y}`;

        for (let i = 1; i < data.length; i++) {
            const { x, y } = pointToSVG(data[i]);
            path += ` L ${x} ${y}`;
        }

        return path;
    };

    // Generate area path for gradient fill
    const generateAreaPath = () => {
        const data = historyData();
        if (data.length === 0) return "";

        const padding = getPadding();
        const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;
        const bottomY = padding.top + innerHeight;
        const firstPoint = pointToSVG(data[0]);

        let path = `M ${firstPoint.x} ${bottomY}`;
        path += ` L ${firstPoint.x} ${firstPoint.y}`;

        for (let i = 1; i < data.length; i++) {
            const { x, y } = pointToSVG(data[i]);
            path += ` L ${x} ${y}`;
        }

        const lastPoint = pointToSVG(data[data.length - 1]);
        path += ` L ${lastPoint.x} ${bottomY} Z`;

        return path;
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 md:p-6">
            {/* Header */}
            <div class="flex flex-col space-y-4 mb-6">
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    VR History
                </h2>

                {/* Period Selection */}
                <div class="flex flex-wrap gap-2">
                    <For
                        each={[
                            { days: 1, label: "24h" },
                            { days: 7, label: "7d" },
                            { days: 30, label: "30d" },
                            { days: null as number | null, label: "Lifetime" },
                        ]}
                    >
                        {(period) => (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomRange(false);
                                    changePeriod(period.days);
                                }}
                                class={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                    !customRange() && selectedDays() === period.days
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {period.label}
                            </button>
                        )}
                    </For>

                    {/* Custom date range toggle */}
                    <button
                        type="button"
                        onClick={() => setShowCustomRange((v) => !v)}
                        class={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            customRange()
                                ? "bg-blue-600 text-white"
                                : showCustomRange()
                                  ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                    >
                        Custom
                    </button>
                </div>

                {/* Custom date range picker */}
                <Show when={showCustomRange()}>
                    <div class="flex flex-wrap items-end gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                From
                            </label>
                            <input
                                type="date"
                                max={todayString()}
                                value={rangeFrom()}
                                onInput={(e) => setRangeFrom(e.currentTarget.value)}
                                class="px-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                To
                            </label>
                            <input
                                type="date"
                                max={todayString()}
                                value={rangeTo()}
                                onInput={(e) => setRangeTo(e.currentTarget.value)}
                                class="px-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyRange}
                            disabled={!rangeFrom() || !rangeTo()}
                            class="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </Show>
            </div>

            {/* Loading State */}
            <Show when={isLoading()}>
                <div class="h-96 flex items-center justify-center">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-gray-400">Loading VR history...</p>
                    </div>
                </div>
            </Show>

            {/* Error State */}
            <Show when={error()}>
                <div class="h-96 flex items-center justify-center">
                    <div class="text-center">
                        <div class="flex justify-center mb-4 text-red-500 dark:text-red-400">
                            <TriangleAlert size={48} />
                        </div>
                        <p class="text-red-600 dark:text-red-400 font-medium mb-2">
                            Failed to load VR history
                        </p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">{error()}</p>
                        <button
                            type="button"
                            onClick={refresh}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* No Data State */}
            <Show when={!isLoading() && !error() && historyData().length === 0}>
                <div class="h-96 flex items-center justify-center">
                    <div class="text-center">
                        <div class="flex justify-center mb-4 text-gray-300 dark:text-gray-600">
                            <ChartBarBig size={48} />
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 font-medium mb-2">
                            No VR history available
                        </p>
                        <p class="text-gray-500 dark:text-gray-500 text-sm">
                            No VR changes found for the selected period
                        </p>
                    </div>
                </div>
            </Show>

            {/* Chart */}
            <Show when={!isLoading() && !error() && historyData().length > 0 && stats()}>
                {/* Stats Summary */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 text-center border border-gray-200 dark:border-gray-700">
                        <div
                            class={`text-lg md:text-2xl font-bold mb-1 ${
                                stats()!.totalChange >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {stats()!.totalChange >= 0 ? "+" : ""}
                            {stats()!.totalChange.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Total Change
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 text-center border border-gray-200 dark:border-gray-700">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.highestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Peak VR
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 text-center border border-gray-200 dark:border-gray-700">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.lowestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Lowest VR
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 text-center border border-gray-200 dark:border-gray-700">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.changesCount}
                        </div>
                        <div class="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Data Points
                        </div>
                    </div>
                </div>

                {/* SVG Chart */}
                <div
                    class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 overflow-x-auto border border-gray-100 dark:border-gray-700"
                    onClick={handleTapOutside}
                    onTouchStart={handleTapOutside}
                >
                    <svg
                        ref={(el) => (svgRef = el)}
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        class="w-full h-auto cursor-crosshair"
                        preserveAspectRatio="xMidYMid meet"
                        onMouseMove={handleSVGMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handleSVGTouchStart}
                    >
                        <defs>
                            {/* Gradient for line */}
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#3B82F6" />
                                <stop offset="50%" stop-color="#8B5CF6" />
                                <stop offset="100%" stop-color="#EC4899" />
                            </linearGradient>

                            {/* Gradient for area */}
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3" />
                                <stop offset="100%" stop-color="#EC4899" stop-opacity="0.05" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <For each={getYAxisTicks()}>
                            {(tick) => {
                                const padding = getPadding();
                                return (
                                    <line
                                        x1={padding.left}
                                        y1={tick.y}
                                        x2={CHART_WIDTH - padding.right}
                                        y2={tick.y}
                                        stroke="currentColor"
                                        class="text-gray-300 dark:text-gray-600"
                                        stroke-width="1"
                                        stroke-dasharray="4,4"
                                    />
                                );
                            }}
                        </For>

                        {/* Area fill */}
                        <path d={generateAreaPath()} fill="url(#areaGradient)" />

                        {/* Main line */}
                        <path
                            d={generatePath()}
                            fill="none"
                            stroke="url(#lineGradient)"
                            stroke-width="4"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />

                        {/* Fallback solid line for flat horizontal cases */}
                        <Show
                            when={(() => {
                                const data = historyData();
                                const allVRValues = data.map((d) => d.totalVR);
                                return Math.min(...allVRValues) === Math.max(...allVRValues);
                            })()}
                        >
                            <path
                                d={generatePath()}
                                fill="none"
                                stroke="#3B82F6"
                                stroke-width="4"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </Show>

                        {/* Y-axis */}
                        <For each={[null]}>
                            {() => {
                                const padding = getPadding();
                                return (
                                    <>
                                        <line
                                            x1={padding.left}
                                            y1={padding.top}
                                            x2={padding.left}
                                            y2={CHART_HEIGHT - padding.bottom}
                                            stroke="currentColor"
                                            class="text-gray-400 dark:text-gray-600"
                                            stroke-width="2"
                                        />

                                        {/* X-axis */}
                                        <line
                                            x1={padding.left}
                                            y1={CHART_HEIGHT - padding.bottom}
                                            x2={CHART_WIDTH - padding.right}
                                            y2={CHART_HEIGHT - padding.bottom}
                                            stroke="currentColor"
                                            class="text-gray-400 dark:text-gray-600"
                                            stroke-width="2"
                                        />
                                    </>
                                );
                            }}
                        </For>

                        {/* Y-axis labels */}
                        <For each={getYAxisTicks()}>
                            {(tick) => {
                                const padding = getPadding();
                                return (
                                    <text
                                        x={padding.left - 10}
                                        y={tick.y + 4}
                                        text-anchor="end"
                                        class="text-xs fill-gray-600 dark:fill-gray-400"
                                        font-family="monospace"
                                    >
                                        {tick.value.toLocaleString()}
                                    </text>
                                );
                            }}
                        </For>

                        {/* X-axis labels */}
                        <For each={getXAxisTicks()}>
                            {(tick) => {
                                const padding = getPadding();
                                return (
                                    <text
                                        x={tick.x}
                                        y={CHART_HEIGHT - padding.bottom + 20}
                                        text-anchor="middle"
                                        class="text-xs fill-gray-600 dark:fill-gray-400"
                                    >
                                        {tick.label}
                                    </text>
                                );
                            }}
                        </For>

                        {/* Individual dots - only rendered for sparse datasets */}
                        <Show when={historyData().length <= DOTS_THRESHOLD}>
                            <For each={historyData()}>
                                {(point) => {
                                    const { x, y } = pointToSVG(point);
                                    return (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="white"
                                            stroke="url(#lineGradient)"
                                            stroke-width="2"
                                            style="pointer-events: none"
                                        />
                                    );
                                }}
                            </For>
                        </Show>

                        {/* Hover crosshair + highlighted dot */}
                        <Show when={hoveredPoint() && hoveredPosition()}>
                            {/* Vertical crosshair line */}
                            <line
                                x1={hoveredPosition()!.x}
                                y1={getPadding().top}
                                x2={hoveredPosition()!.x}
                                y2={CHART_HEIGHT - getPadding().bottom}
                                stroke="currentColor"
                                class="text-gray-400 dark:text-gray-500"
                                stroke-width="1"
                                stroke-dasharray="4,4"
                                style="pointer-events: none"
                            />
                            {/* Highlighted dot */}
                            <circle
                                cx={hoveredPosition()!.x}
                                cy={hoveredPosition()!.y}
                                r="6"
                                fill="white"
                                stroke="url(#lineGradient)"
                                stroke-width="2"
                                style="pointer-events: none"
                            />
                        </Show>

                        {/* Hover tooltip */}
                        <Show when={hoveredPoint() && hoveredPosition()}>
                            <g>
                                {(() => {
                                    const point = hoveredPoint()!;
                                    const pos = hoveredPosition()!;
                                    const padding = getPadding();

                                    // Tooltip width varies with the amount of date info shown
                                    const rangeDays = displayRangeDays();
                                    const tooltipWidth =
                                        rangeDays > 30 ? 145 : rangeDays <= 1 ? 110 : 135;
                                    const tooltipHeight = 60;

                                    // Format timestamp - include time for multi-day periods since
                                    // we now show individual sessions, not daily aggregates
                                    const pointDate = new Date(point.date);
                                    const hh = String(pointDate.getHours()).padStart(2, "0");
                                    const mm = String(pointDate.getMinutes()).padStart(2, "0");
                                    const dd = String(pointDate.getDate()).padStart(2, "0");
                                    const mo = String(pointDate.getMonth() + 1).padStart(2, "0");
                                    const yyyy = pointDate.getFullYear();

                                    let timestamp: string;
                                    if (rangeDays <= 1) {
                                        timestamp = `${hh}:${mm}`;
                                    } else if (rangeDays > 30) {
                                        timestamp = `${dd}/${mo}/${yyyy} ${hh}:${mm}`;
                                    } else {
                                        timestamp = `${dd}/${mo} ${hh}:${mm}`;
                                    }

                                    // Determine X position (left or right of cursor)
                                    let tooltipX =
                                        pos.x > CHART_WIDTH / 2
                                            ? pos.x - tooltipWidth - 10
                                            : pos.x + 10;

                                    // Keep tooltip within chart bounds horizontally
                                    if (tooltipX < padding.left) {
                                        tooltipX = padding.left;
                                    } else if (
                                        tooltipX + tooltipWidth >
                                        CHART_WIDTH - padding.right
                                    ) {
                                        tooltipX = CHART_WIDTH - padding.right - tooltipWidth;
                                    }

                                    // Determine Y position (above or below point)
                                    let tooltipY = pos.y - tooltipHeight - 10;

                                    // If tooltip would go above chart, show it below the point instead
                                    if (tooltipY < padding.top) {
                                        tooltipY = pos.y + 15;
                                    }

                                    // Keep tooltip within chart bounds vertically
                                    if (tooltipY + tooltipHeight > CHART_HEIGHT - padding.bottom) {
                                        tooltipY = CHART_HEIGHT - padding.bottom - tooltipHeight;
                                    }

                                    return (
                                        <>
                                            <rect
                                                x={tooltipX}
                                                y={tooltipY}
                                                width={tooltipWidth}
                                                height={tooltipHeight}
                                                rx="6"
                                                fill="white"
                                                stroke="#E5E7EB"
                                                stroke-width="2"
                                                class="dark:fill-gray-800 dark:stroke-gray-600"
                                                style="pointer-events: none"
                                            />
                                            <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 18}
                                                text-anchor="middle"
                                                class="text-xs fill-gray-600 dark:fill-gray-400"
                                                style="pointer-events: none"
                                            >
                                                {timestamp}
                                            </text>
                                            <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 35}
                                                text-anchor="middle"
                                                class="text-xs fill-gray-900 dark:fill-white font-bold"
                                                style="pointer-events: none"
                                            >
                                                {point.totalVR.toLocaleString()} VR
                                            </text>
                                            <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 50}
                                                text-anchor="middle"
                                                class={`text-xs font-semibold ${
                                                    point.vrChange >= 0
                                                        ? "fill-emerald-600"
                                                        : "fill-red-600"
                                                }`}
                                                style="pointer-events: none"
                                            >
                                                {point.vrChange >= 0 ? "+" : ""}
                                                {point.vrChange}
                                            </text>
                                        </>
                                    );
                                })()}
                            </g>
                        </Show>
                    </svg>
                </div>

                <div class="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <Info size={14} />
                    <span>{isMobile() ? "Tap" : "Hover"} to inspect individual sessions</span>
                </div>
            </Show>
        </div>
    );
}
