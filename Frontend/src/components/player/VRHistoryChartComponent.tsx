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

    const [selectedPoint, setSelectedPoint] =
    createSignal<ProcessedVRHistory | null>(null);
    const [showModal, setShowModal] = createSignal(false);

    // Calculate chart dimensions and scaling
    const getChartDimensions = () => {
        const data = historyData();
        if (data.length === 0) return { minVR: 0, maxVR: 0, range: 0 };

        const vrValues = data.map((d) => d.totalVR);
        const minVR = Math.min(...vrValues);
        const maxVR = Math.max(...vrValues);
        const range = maxVR - minVR;
        const padding = range * 0.1; // 10% padding

        return {
            minVR: minVR - padding,
            maxVR: maxVR + padding,
            range: range + padding * 2,
        };
    };

    const getPointPosition = (point: ProcessedVRHistory, index: number) => {
        const { minVR, maxVR } = getChartDimensions();
        const data = historyData();

        const x = (index / Math.max(data.length - 1, 1)) * 100; // percentage
        const y = 100 - ((point.totalVR - minVR) / (maxVR - minVR)) * 100; // inverted percentage

        return { x, y };
    };

    const generateSVGPath = () => {
        const data = historyData();
        if (data.length === 0) return "";

        let path = "";

        data.forEach((point, index) => {
            const { x, y } = getPointPosition(point, index);
            const command = index === 0 ? "M" : "L";
            path += `${command} ${x} ${y} `;
        });

        return path;
    };

    const generateGradientPath = () => {
        const data = historyData();
        if (data.length === 0) return "";

        let path = generateSVGPath();

        // Close the path for gradient fill
        if (data.length > 0) {
            const lastPoint = getPointPosition(
                data[data.length - 1],
                data.length - 1
            );
            const firstPoint = getPointPosition(data[0], 0);
            path += `L ${lastPoint.x} 100 L ${firstPoint.x} 100 Z`;
        }

        return path;
    };

    const handlePointClick = (point: ProcessedVRHistory) => {
        setSelectedPoint(point);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPoint(null);
    };

    return (
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/20 p-4 md:p-6 transition-colors">
            {/* Header */}
            <div class="flex flex-col space-y-4 mb-6">
                <div class="flex items-center">
                    <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            VR History
                    </h2>
                </div>

                {/* Period Selection - Mobile optimized */}
                <div class="flex space-x-2 overflow-x-auto">
                    <For each={[7, 14, 30]}>
                        {(days) => (
                            <button
                                onClick={() => changePeriod(days)}
                                class={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-w-[60px] ${
                                    selectedDays() === days
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {days}d
                            </button>
                        )}
                    </For>
                </div>
            </div>

            {/* Loading State */}
            <Show when={isLoading()}>
                <div class="h-64 md:h-80 flex items-center justify-center">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-gray-400">
              Loading VR history...
                        </p>
                    </div>
                </div>
            </Show>

            {/* Error State */}
            <Show when={error()}>
                <div class="h-64 md:h-80 flex items-center justify-center">
                    <div class="text-center">
                        <div class="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
                        <p class="text-red-600 dark:text-red-400 font-medium mb-2">
              Failed to load VR history
                        </p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {error()}
                        </p>
                        <button
                            onClick={refresh}
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
              Try Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* No Data State */}
            <Show when={!isLoading() && !error() && historyData().length === 0}>
                <div class="h-64 md:h-80 flex items-center justify-center">
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

            {/* Chart and Stats */}
            <Show
                when={!isLoading() && !error() && historyData().length > 0 && stats()}
            >
                {/* Stats Summary - Mobile responsive grid */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 md:p-4 text-center border border-blue-200 dark:border-blue-800">
                        <div
                            class={`text-lg md:text-2xl font-bold mb-1 ${
                stats()!.totalChange >= 0
                    ? "text-green-600 dark:text-green-400"
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

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.highestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
              Peak VR
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.lowestVR.toLocaleString()}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
              Lowest VR
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                        <div class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stats()!.changesCount}
                        </div>
                        <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
              VR Changes
                        </div>
                    </div>
                </div>

                {/* Custom SVG Chart - Mobile optimized */}
                <div class="relative">
                    <div class="h-64 md:h-80 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-2 md:p-4 border border-gray-200 dark:border-gray-600">
                        <svg
                            viewBox="0 0 100 100"
                            class="w-full h-full"
                            preserveAspectRatio="none"
                        >
                            {/* Gradient definitions */}
                            <defs>
                                <linearGradient
                                    id="vrGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        style="stop-color:#3B82F6;stop-opacity:0.3"
                                    />
                                    <stop
                                        offset="100%"
                                        style="stop-color:#8B5CF6;stop-opacity:0.1"
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="lineGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                >
                                    <stop offset="0%" style="stop-color:#3B82F6" />
                                    <stop offset="100%" style="stop-color:#8B5CF6" />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            <For each={[0, 25, 50, 75, 100]}>
                                {(y) => (
                                    <line
                                        x1="0"
                                        y1={y}
                                        x2="100"
                                        y2={y}
                                        stroke="#E5E7EB"
                                        stroke-width="0.1"
                                        stroke-dasharray="1,1"
                                    />
                                )}
                            </For>

                            {/* Area fill */}
                            <Show when={historyData().length > 1}>
                                <path
                                    d={generateGradientPath()}
                                    fill="url(#vrGradient)"
                                    stroke="none"
                                />
                            </Show>

                            {/* Main line */}
                            <Show when={historyData().length > 1}>
                                <path
                                    d={generateSVGPath()}
                                    fill="none"
                                    stroke="url(#lineGradient)"
                                    stroke-width="0.3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </Show>

                            {/* Data points - Mobile optimized with larger touch targets */}
                            <For each={historyData()}>
                                {(point, index) => {
                                    const { x, y } = getPointPosition(point, index());
                                    const isSelected = selectedPoint() === point;
                                    return (
                                        <>
                                            {/* Invisible larger touch target for mobile */}
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r="3"
                                                fill="transparent"
                                                class="cursor-pointer md:hidden"
                                                onClick={() => handlePointClick(point)}
                                            />
                                            {/* Visible point */}
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={isSelected ? "1.2" : "0.8"}
                                                fill={isSelected ? "#8B5CF6" : "#3B82F6"}
                                                stroke="#FFFFFF"
                                                stroke-width="0.2"
                                                class="cursor-pointer transition-all duration-200 pointer-events-none md:pointer-events-auto"
                                                onClick={() => handlePointClick(point)}
                                            />
                                        </>
                                    );
                                }}
                            </For>
                        </svg>
                    </div>

                    {/* Chart Legend - Updated for mobile */}
                    <div class="mt-4 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <p class="md:hidden">📱 Tap points to see detailed VR changes</p>
                        <p class="hidden md:block">
              💡 Click points to see detailed VR changes
                        </p>
                    </div>
                </div>
            </Show>

            {/* Modal for point details - Mobile friendly */}
            <Show when={showModal() && selectedPoint()}>
                <div
                    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div
                        class="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-transform"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar for mobile */}
                        <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 md:hidden"></div>

                        <div class="text-center">
                            <p class="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                                {selectedPoint()!.formattedDate}
                            </p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {selectedPoint()!.totalVR.toLocaleString()} VR
                            </p>
                            <p
                                class={`text-lg font-medium mb-4 ${
                  selectedPoint()!.vrChange >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                                }`}
                            >
                                {selectedPoint()!.vrChange >= 0 ? "+" : ""}
                                {selectedPoint()!.vrChange.toLocaleString()} VR
                            </p>
                            <button
                                onClick={closeModal}
                                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                            >
                Close
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
