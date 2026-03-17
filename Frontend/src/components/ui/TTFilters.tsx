import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { DriftCategoryFilter, DriftFilter, ShroomlessFilter, VehicleFilter } from "../../types/timeTrial";

interface TTFiltersProps {
    trackId: number;
    trackSupportsGlitch: boolean;
    currentCC: 150 | 200;
    currentGlitchAllowed: boolean;
    shroomlessFilter: ShroomlessFilter;
    vehicleFilter: VehicleFilter;
    driftFilter: DriftFilter;
    driftCategoryFilter: DriftCategoryFilter;
    pageSize: number;
    onShroomlessFilterChange: (filter: ShroomlessFilter) => void;
    onVehicleFilterChange: (filter: VehicleFilter) => void;
    onDriftFilterChange: (filter: DriftFilter) => void;
    onDriftCategoryFilterChange: (filter: DriftCategoryFilter) => void;
    onPageSizeChange: (size: number) => void;
}

export default function TTFilters(props: TTFiltersProps) {
    return (
        <div class="space-y-4">
            {/* CC Switcher */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Engine Class
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <A
                        href={props.currentGlitchAllowed
                            ? `/timetrial/150cc/${props.trackId}`
                            : `/timetrial/no-glitch-150cc/${props.trackId}`}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                            props.currentCC === 150
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        150cc
                    </A>
                    <A
                        href={props.currentGlitchAllowed
                            ? `/timetrial/200cc/${props.trackId}`
                            : `/timetrial/no-glitch-200cc/${props.trackId}`}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                            props.currentCC === 200
                                ? "bg-sky-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        200cc
                    </A>
                </div>
            </div>

            {/* Glitch/Category Type Switcher */}
            <Show when={props.trackSupportsGlitch}>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Category Type
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <A
                            href={`/timetrial/${props.currentCC}cc/${props.trackId}`}
                            class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                                props.currentGlitchAllowed
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Unrestricted
                        </A>
                        <A
                            href={`/timetrial/no-glitch-${props.currentCC}cc/${props.trackId}`}
                            class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                                !props.currentGlitchAllowed
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Non-Glitch/Shortcut
                        </A>
                    </div>
                </div>
            </Show>

            {/* All filters grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Vehicle Type */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Vehicle Type
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        {(["all", "karts", "bikes"] as VehicleFilter[]).map((v) => (
                            <button
                                onClick={() => props.onVehicleFilterChange(v)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.vehicleFilter === v
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shroomless */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Shroomless
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        {(["all", "only", "exclude"] as ShroomlessFilter[]).map((s) => (
                            <button
                                onClick={() => props.onShroomlessFilterChange(s)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.shroomlessFilter === s
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Drift Type */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Drift Type
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        {(["all", "manual", "hybrid"] as DriftFilter[]).map((d) => (
                            <button
                                onClick={() => props.onDriftFilterChange(d)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.driftFilter === d
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Drift Category */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Drift Category
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        {(["all", "inside", "outside"] as DriftCategoryFilter[]).map((d) => (
                            <button
                                onClick={() => props.onDriftCategoryFilterChange(d)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.driftCategoryFilter === d
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Per Page */}
                <div>
                    <label for="tt-page-size-select" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Results Per Page
                    </label>
                    <select
                        id="tt-page-size-select"
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
        </div>
    );
}
