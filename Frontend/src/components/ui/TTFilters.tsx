import { Show } from "solid-js";

interface TTFiltersProps {
  selectedCC: 150 | 200;
  vehicleFilter: "all" | "bikes" | "karts";
  driftFilter: "all" | "manual" | "hybrid";
  categoryFilter: "all" | "glitch" | "shroomless" | "normal";
  pageSize: number;
  category: "retro" | "custom";
  onCCChange: (cc: 150 | 200) => void;
  onVehicleFilterChange: (filter: "all" | "bikes" | "karts") => void;
  onDriftFilterChange: (filter: "all" | "manual" | "hybrid") => void;
  onCategoryFilterChange: (filter: "all" | "glitch" | "shroomless" | "normal") => void;
  onPageSizeChange: (size: number) => void;
}

export default function TTFilters(props: TTFiltersProps) {
    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                <span class="text-3xl mr-3">🎮</span>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Filters & Options
                </h2>
            </div>

            <div class="space-y-6">
                {/* CC Selection */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Engine Class
                    </label>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => props.onCCChange(150)}
                            class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                props.selectedCC === 150
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            150cc
                        </button>
                        <button
                            onClick={() => props.onCCChange(200)}
                            class={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                                props.selectedCC === 200
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            200cc
                        </button>
                    </div>
                </div>

                {/* Vehicle Type Filter */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Vehicle Type
                    </label>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => props.onVehicleFilterChange("all")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.vehicleFilter === "all"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => props.onVehicleFilterChange("bikes")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.vehicleFilter === "bikes"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            🏍️ Bikes
                        </button>
                        <button
                            onClick={() => props.onVehicleFilterChange("karts")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.vehicleFilter === "karts"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            🏎️ Karts
                        </button>
                    </div>
                </div>

                {/* Drift Type Filter */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Drift Type
                    </label>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => props.onDriftFilterChange("all")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.driftFilter === "all"
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => props.onDriftFilterChange("manual")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.driftFilter === "manual"
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Manual
                        </button>
                        <button
                            onClick={() => props.onDriftFilterChange("hybrid")}
                            class={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                props.driftFilter === "hybrid"
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Hybrid
                        </button>
                    </div>
                </div>

                {/* Category Filter (only for custom tracks) */}
                <Show when={props.category === "custom"}>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Run Category
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 grid grid-cols-2 gap-1 border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => props.onCategoryFilterChange("all")}
                                class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                    props.categoryFilter === "all"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => props.onCategoryFilterChange("normal")}
                                class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                    props.categoryFilter === "normal"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Normal
                            </button>
                            <button
                                onClick={() => props.onCategoryFilterChange("shroomless")}
                                class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                    props.categoryFilter === "shroomless"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                🍄 Shroomless
                            </button>
                            <button
                                onClick={() => props.onCategoryFilterChange("glitch")}
                                class={`px-4 py-2 rounded-md font-medium transition-all text-sm ${
                                    props.categoryFilter === "glitch"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                ⚡ Glitch
                            </button>
                        </div>
                    </div>
                </Show>

                {/* Results Per Page */}
                <div>
                    <label for="page-size-select" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Results Per Page
                    </label>
                    <select
                        id="page-size-select"
                        value={props.pageSize}
                        onChange={(e) => props.onPageSizeChange(parseInt(e.target.value))}
                        class="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="10">10 times</option>
                        <option value="25">25 times</option>
                        <option value="50">50 times</option>
                        <option value="100">100 times</option>
                    </select>
                </div>
            </div>
        </div>
    );
}