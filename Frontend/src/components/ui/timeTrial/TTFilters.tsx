import { A } from "@solidjs/router";
import { Show } from "solid-js";
import {
    DriftCategoryFilter,
    DriftFilter,
    LeaderboardMode,
    ShroomlessFilter,
    VehicleFilter,
} from "../../../types/timeTrial";
import ToggleGroup from "../../common/ToggleGroup";

interface TTFiltersProps {
    trackId: number;
    trackSupportsGlitch: boolean;
    currentCC: 150 | 200;
    currentGlitchAllowed: boolean;
    currentMode: LeaderboardMode;
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

// Builds the route for a given combination of cc, glitch, and mode
function buildRoute(
    trackId: number,
    cc: 150 | 200,
    glitchAllowed: boolean,
    mode: LeaderboardMode,
): string {
    const flapPrefix = mode === "flap" ? "flap-" : "";
    const glitchPrefix = !glitchAllowed ? "no-glitch-" : "";
    return `/timetrial/${flapPrefix}${glitchPrefix}${cc}cc/${trackId}`;
}

export default function TTFilters(props: TTFiltersProps) {
    return (
        <div class="space-y-4">
            {/* CC Switcher - uses navigation links to change the URL */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Engine Class
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <A
                        href={buildRoute(
                            props.trackId,
                            150,
                            props.currentGlitchAllowed,
                            props.currentMode,
                        )}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                            props.currentCC === 150
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        150cc
                    </A>
                    <A
                        href={buildRoute(
                            props.trackId,
                            200,
                            props.currentGlitchAllowed,
                            props.currentMode,
                        )}
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

            {/* Glitch/Category Type Switcher - navigation links, only shown when track supports it */}
            <Show when={props.trackSupportsGlitch}>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Category Type
                    </label>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                        <A
                            href={buildRoute(
                                props.trackId,
                                props.currentCC,
                                true,
                                props.currentMode,
                            )}
                            class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                                props.currentGlitchAllowed
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Unrestricted
                        </A>
                        <A
                            href={buildRoute(
                                props.trackId,
                                props.currentCC,
                                false,
                                props.currentMode,
                            )}
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

            {/* Flap Mode Toggle - navigation links */}
            <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Leaderboard Type
                </label>
                <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                    <A
                        href={buildRoute(
                            props.trackId,
                            props.currentCC,
                            props.currentGlitchAllowed,
                            "regular",
                        )}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                            props.currentMode === "regular"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        Regular
                    </A>
                    <A
                        href={buildRoute(
                            props.trackId,
                            props.currentCC,
                            props.currentGlitchAllowed,
                            "flap",
                        )}
                        class={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm text-center ${
                            props.currentMode === "flap"
                                ? "bg-orange-500 text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                        ⚡ Flap
                    </A>
                </div>
            </div>

            {/* Display filters grid - button-based, client-side only */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Vehicle Type */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Vehicle Type
                    </label>
                    <ToggleGroup<VehicleFilter>
                        value={props.vehicleFilter}
                        onChange={props.onVehicleFilterChange}
                        options={[
                            { value: "all", label: "All" },
                            { value: "karts", label: "Karts" },
                            { value: "bikes", label: "Bikes" },
                        ]}
                    />
                </div>

                {/* Shroomless */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Shroomless
                    </label>
                    <ToggleGroup<ShroomlessFilter>
                        value={props.shroomlessFilter}
                        onChange={props.onShroomlessFilterChange}
                        activeClass="bg-amber-600"
                        options={[
                            { value: "all", label: "All" },
                            { value: "only", label: "Only" },
                            { value: "exclude", label: "Exclude" },
                        ]}
                    />
                </div>

                {/* Drift Type */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Drift Type
                    </label>
                    <ToggleGroup<DriftFilter>
                        value={props.driftFilter}
                        onChange={props.onDriftFilterChange}
                        activeClass="bg-purple-600"
                        options={[
                            { value: "all", label: "All" },
                            { value: "manual", label: "Manual" },
                            { value: "hybrid", label: "Hybrid" },
                        ]}
                    />
                </div>

                {/* Drift Category */}
                <div>
                    <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Drift Category
                    </label>
                    <ToggleGroup<DriftCategoryFilter>
                        value={props.driftCategoryFilter}
                        onChange={props.onDriftCategoryFilterChange}
                        activeClass="bg-indigo-600"
                        options={[
                            { value: "all", label: "All" },
                            { value: "inside", label: "Inside" },
                            { value: "outside", label: "Outside" },
                        ]}
                    />
                </div>

                {/* Results Per Page */}
                <div>
                    <label
                        for="tt-page-size-select"
                        class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                    >
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
