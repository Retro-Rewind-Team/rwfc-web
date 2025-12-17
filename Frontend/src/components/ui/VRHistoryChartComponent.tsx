import { createSignal, For, Show } from "solid-js";
import { ProcessedVRHistory, useVRHistory } from "../../hooks/useVRHistory";

interface VRHistoryChartProps {
  readonly friendCode: string;
  readonly initialDays?: number;
}

export default function VRHistoryChart(props: VRHistoryChartProps) {
    const {
        historyData,
        stats,
        selectedDays,
        isLoading,
        error,
        changePeriod,
        refresh,
    } = useVRHistory(props.friendCode, props.initialDays);

    const [hoveredPoint, setHoveredPoint] = createSignal<ProcessedVRHistory | null>(null);
    const [hoveredPosition, setHoveredPosition] = createSignal<{ x: number; y: number } | null>(null);
    
    // Detect mobile - check both screen size and touch capability
    const isMobile = () => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < 768 || ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    };

    // Chart dimensions
    const CHART_HEIGHT = 400;
    const CHART_WIDTH = 800;
    
    // Dynamic padding based on selected period
    const getPadding = () => {
        const days = selectedDays();
        return {
            top: 20,
            right: 20,
            bottom: days === null ? 80 : 60, // More space for lifetime dates
            left: 80
        };
    };

    // Calculate scales - now just returns min and max
    const getScales = () => {
        const data = historyData();
        if (data.length === 0) {
            return { minVR: 0, maxVR: 10000, vrRange: 10000 };
        }

        const allVRValues = data.map(d => d.totalVR);
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
        const y = padding.top + innerHeight - ((point.totalVR - scales.minVR) / scales.vrRange) * innerHeight;
        
        return { x, y };
    };

    // Generate Y-axis ticks - ONLY min and max
    const getYAxisTicks = () => {
        const scales = getScales();
        const padding = getPadding();
        const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;
        return [
            { value: scales.minVR, y: padding.top + innerHeight },
            { value: scales.maxVR, y: padding.top }
        ];
    };

    // Generate X-axis ticks - ONLY first and last timestamps
    const getXAxisTicks = () => {
        const data = historyData();
        const days = selectedDays();
        
        if (data.length === 0) return [];
        
        const firstDate = new Date(data[0].date);
        const lastDate = new Date(data[data.length - 1].date);
        const firstPoint = pointToSVG(data[0]);
        const lastPoint = pointToSVG(data[data.length - 1]);
        
        if (days === 1) {
            // 24h - show time only
            const firstLabel = `${String(firstDate.getHours()).padStart(2, "0")}:${String(firstDate.getMinutes()).padStart(2, "0")}`;
            const lastLabel = `${String(lastDate.getHours()).padStart(2, "0")}:${String(lastDate.getMinutes()).padStart(2, "0")}`;
            
            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x }
            ];
        } else if (days === null) {
            // Lifetime - show full date (dd-mm-yyyy)
            const firstLabel = `${String(firstDate.getDate()).padStart(2, "0")}-${String(firstDate.getMonth() + 1).padStart(2, "0")}-${firstDate.getFullYear()}`;
            const lastLabel = `${String(lastDate.getDate()).padStart(2, "0")}-${String(lastDate.getMonth() + 1).padStart(2, "0")}-${lastDate.getFullYear()}`;
            
            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x }
            ];
        } else {
            // 7d, 30d - show date (dd/mm)
            const firstLabel = `${String(firstDate.getDate()).padStart(2, "0")}/${String(firstDate.getMonth() + 1).padStart(2, "0")}`;
            const lastLabel = `${String(lastDate.getDate()).padStart(2, "0")}/${String(lastDate.getMonth() + 1).padStart(2, "0")}`;
            
            return [
                { label: firstLabel, x: firstPoint.x },
                { label: lastLabel, x: lastPoint.x }
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

    // Generate area path (for gradient fill)
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

    const handlePointInteraction = (point: ProcessedVRHistory) => {
        const { x, y } = pointToSVG(point);
        setHoveredPoint(point);
        setHoveredPosition({ x, y });
    };

    const handleMouseLeave = () => {
        // On mobile, don't clear on mouse leave since we use tap
        if (!isMobile()) {
            setHoveredPoint(null);
            setHoveredPosition(null);
        }
    };

    const handleTapOutside = () => {
        // Clear tooltip when tapping outside on mobile
        if (isMobile()) {
            setHoveredPoint(null);
            setHoveredPosition(null);
        }
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 md:p-6">
            {/* Header */}
            <div class="flex flex-col space-y-4 mb-6">
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    📈 VR History
                </h2>

                {/* Period Selection */}
                <div class="flex space-x-2 overflow-x-auto">
                    <For each={[
                        { days: 1, label: "24h" },
                        { days: 7, label: "7d" },
                        { days: 30, label: "30d" },
                        { days: null as number | null, label: "Lifetime" },
                    ]}>
                        {(period) => (
                            <button
                                onClick={() => changePeriod(period.days)}
                                class={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                    selectedDays() === period.days
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {period.label}
                            </button>
                        )}
                    </For>
                </div>
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
                        <div class="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
                        <p class="text-red-600 dark:text-red-400 font-medium mb-2">
                            Failed to load VR history
                        </p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">{error()}</p>
                        <button
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
                        <div class="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
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
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4 text-center border-2 border-blue-200 dark:border-blue-800">
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
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Total Change
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center border-2 border-gray-200 dark:border-gray-600">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.highestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Peak VR
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center border-2 border-gray-200 dark:border-gray-600">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.lowestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Lowest VR
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center border-2 border-gray-200 dark:border-gray-600">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.changesCount}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Data Points
                        </div>
                    </div>
                </div>

                {/* SVG Chart */}
                <div 
                    class="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 overflow-x-auto"
                    onClick={handleTapOutside}
                    onTouchStart={handleTapOutside}
                >
                    <svg
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        class="w-full h-auto"
                        preserveAspectRatio="xMidYMid meet"
                        onMouseLeave={handleMouseLeave}
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

                        {/* Grid lines - only at min and max */}
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
                        <path
                            d={generateAreaPath()}
                            fill="url(#areaGradient)"
                        />

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
                        <Show when={(() => {
                            const data = historyData();
                            const allVRValues = data.map(d => d.totalVR);
                            return Math.min(...allVRValues) === Math.max(...allVRValues);
                        })()}>
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

                        {/* Y-axis labels - only min and max */}
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

                        {/* X-axis labels - only first and last */}
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

                        {/* Data points */}
                        <For each={historyData()}>
                            {(point) => {
                                const { x, y } = pointToSVG(point);
                                const isHovered = hoveredPoint() === point;
                                
                                return (
                                    <g>
                                        {/* Larger invisible hitbox */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="12"
                                            fill="transparent"
                                            class="cursor-pointer"
                                            onMouseEnter={() => !isMobile() && handlePointInteraction(point)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePointInteraction(point);
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                                handlePointInteraction(point);
                                            }}
                                        />
                                        
                                        {/* Visible dot */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={isHovered ? "6" : "4"}
                                            fill="white"
                                            stroke="url(#lineGradient)"
                                            stroke-width="2"
                                            class="transition-all cursor-pointer pointer-events-none"
                                        />
                                    </g>
                                );
                            }}
                        </For>

                        {/* Hover tooltip */}
                        <Show when={hoveredPoint() && hoveredPosition()}>
                            <g>
                                {(() => {
                                    const point = hoveredPoint()!;
                                    const pos = hoveredPosition()!;
                                    const tooltipWidth = 120;
                                    const tooltipHeight = 60;
                                    const days = selectedDays();
                                    const padding = getPadding();
                                    
                                    // Format timestamp based on period
                                    const pointDate = new Date(point.date);
                                    let timestamp: string;
                                    
                                    if (days === 1) {
                                        // 24h - show time (hh:mm)
                                        timestamp = `${String(pointDate.getHours()).padStart(2, "0")}:${String(pointDate.getMinutes()).padStart(2, "0")}`;
                                    } else if (days === null) {
                                        // Lifetime - show full date (dd/mm/yyyy)
                                        timestamp = `${String(pointDate.getDate()).padStart(2, "0")}/${String(pointDate.getMonth() + 1).padStart(2, "0")}/${pointDate.getFullYear()}`;
                                    } else {
                                        // 7d, 30d - show date (dd/mm)
                                        timestamp = `${String(pointDate.getDate()).padStart(2, "0")}/${String(pointDate.getMonth() + 1).padStart(2, "0")}`;
                                    }
                                    
                                    // Determine X position (left or right of cursor)
                                    let tooltipX = pos.x > CHART_WIDTH / 2 ? pos.x - tooltipWidth - 10 : pos.x + 10;
                                    
                                    // Keep tooltip within chart bounds horizontally
                                    if (tooltipX < padding.left) {
                                        tooltipX = padding.left;
                                    } else if (tooltipX + tooltipWidth > CHART_WIDTH - padding.right) {
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
                                            />
                                            <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 18}
                                                text-anchor="middle"
                                                class="text-xs fill-gray-600 dark:fill-gray-400"
                                            >
                                                {timestamp}
                                            </text>
                                            <text
                                                x={tooltipX + tooltipWidth / 2}
                                                y={tooltipY + 35}
                                                text-anchor="middle"
                                                class="text-xs fill-gray-900 dark:fill-white font-bold"
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
                                            >
                                                {point.vrChange >= 0 ? "+" : ""}{point.vrChange}
                                            </text>
                                        </>
                                    );
                                })()}
                            </g>
                        </Show>
                    </svg>
                </div>

                <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    💡 {isMobile() ? "Tap" : "Hover over"} points to see details
                </div>
            </Show>
        </div>
    );
}