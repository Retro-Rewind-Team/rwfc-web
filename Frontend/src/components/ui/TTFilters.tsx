import { Show } from "solid-js";

interface TTFiltersProps {
  selectedCC: 150 | 200;
  shroomlessFilter: "all" | "only" | "exclude";
  glitchFilter: "all" | "only" | "exclude";
  vehicleFilter: "all" | "bikes" | "karts";
  driftFilter: "all" | "manual" | "hybrid";
  pageSize: number;
  category: "retro" | "custom";
  onCCChange: (cc: 150 | 200) => void;
  onShroomlessFilterChange: (filter: "all" | "only" | "exclude") => void;
  onGlitchFilterChange: (filter: "all" | "only" | "exclude") => void;
  onVehicleFilterChange: (filter: "all" | "bikes" | "karts") => void;
  onDriftFilterChange: (filter: "all" | "manual" | "hybrid") => void;
  onPageSizeChange: (size: number) => void;
}

export default function TTFilters(props: TTFiltersProps) {
    return (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* CC Selection */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Engine Class
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => props.onCCChange(150)}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm ${
                            props.selectedCC === 150
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        150cc
                    </button>
                    <button
                        onClick={() => props.onCCChange(200)}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm ${
                            props.selectedCC === 200
                                ? "bg-sky-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        200cc
                    </button>
                </div>
            </div>

            {/* Shroomless Filter */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Shroomless
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => props.onShroomlessFilterChange("all")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.shroomlessFilter === "all"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => props.onShroomlessFilterChange("only")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.shroomlessFilter === "only"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Only
                    </button>
                    <button
                        onClick={() => props.onShroomlessFilterChange("exclude")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.shroomlessFilter === "exclude"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Exclude
                    </button>
                </div>
            </div>

            {/* Glitch Filter - Only for Custom Tracks */}
            <Show when={props.category === "custom"}>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Glitch
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => props.onGlitchFilterChange("all")}
                            class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                props.glitchFilter === "all"
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => props.onGlitchFilterChange("only")}
                            class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                props.glitchFilter === "only"
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Only
                        </button>
                        <button
                            onClick={() => props.onGlitchFilterChange("exclude")}
                            class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                props.glitchFilter === "exclude"
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Exclude
                        </button>
                    </div>
                </div>
            </Show>

            {/* Vehicle Type Filter */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Type
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => props.onVehicleFilterChange("all")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.vehicleFilter === "all"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => props.onVehicleFilterChange("bikes")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.vehicleFilter === "bikes"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Bikes
                    </button>
                    <button
                        onClick={() => props.onVehicleFilterChange("karts")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.vehicleFilter === "karts"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Karts
                    </button>
                </div>
            </div>

            {/* Drift Type Filter */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Drift Type
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => props.onDriftFilterChange("all")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.driftFilter === "all"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => props.onDriftFilterChange("manual")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.driftFilter === "manual"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Manual
                    </button>
                    <button
                        onClick={() => props.onDriftFilterChange("hybrid")}
                        class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                            props.driftFilter === "hybrid"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Hybrid
                    </button>
                </div>
            </div>

            {/* Results Per Page */}
            <div>
                <label for="page-size-select" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Results Per Page
                </label>
                <select
                    id="page-size-select"
                    value={props.pageSize}
                    onChange={(e) => props.onPageSizeChange(parseInt(e.target.value))}
                    class="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                    <option value="10">10 times</option>
                    <option value="25">25 times</option>
                    <option value="50">50 times</option>
                </select>
            </div>
        </div>
    );
}