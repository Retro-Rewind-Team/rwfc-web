import { ShroomlessFilter, VehicleFilter } from "../../types/timeTrial";

interface TTBrowserFiltersProps {
    selectedCategory: "retro" | "custom";
    selectedCC: 150 | 200;
    glitchAllowed: boolean;
    shroomlessFilter: ShroomlessFilter;
    vehicleFilter: VehicleFilter;
    searchQuery: string;
    onCategoryChange: (category: "retro" | "custom") => void;
    onCCChange: (cc: 150 | 200) => void;
    onGlitchAllowedChange: (allowed: boolean) => void;
    onShroomlessFilterChange: (filter: ShroomlessFilter) => void;
    onVehicleFilterChange: (filter: VehicleFilter) => void;
    onSearchInput: (value: string) => void;
}

export default function TTBrowserFilters(props: TTBrowserFiltersProps) {
    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div class={`px-4 sm:px-6 py-4 ${!props.glitchAllowed ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-blue-600"}`}>
                <div class="flex items-center gap-3">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold text-white">Browse Tracks</h2>
                        <p class="text-blue-100 text-xs sm:text-sm">
                            {props.selectedCC}cc •{" "}
                            {!props.glitchAllowed ? "Non-Glitch/Shortcut" : "Unrestricted"} •{" "}
                            {props.vehicleFilter !== "all"
                                ? props.vehicleFilter.charAt(0).toUpperCase() + props.vehicleFilter.slice(1)
                                : "All Vehicles"
                            } •{" "}
                            {props.shroomlessFilter === "only"
                                ? "Shroomless"
                                : props.shroomlessFilter === "exclude"
                                    ? "No Shroomless"
                                    : "All Categories"
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div class="bg-gray-50 dark:bg-gray-700/50 p-4 border-b-2 border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Track Category */}
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Track Category
                        </label>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            {(["retro", "custom"] as const).map((cat) => (
                                <button
                                    onClick={() => props.onCategoryChange(cat)}
                                    class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                        props.selectedCategory === cat
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Engine Class */}
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Engine Class
                        </label>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => props.onCCChange(150)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.selectedCC === 150
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                150cc
                            </button>
                            <button
                                onClick={() => props.onCCChange(200)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.selectedCC === 200
                                        ? "bg-sky-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                200cc
                            </button>
                        </div>
                    </div>

                    {/* Category Type */}
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Category Type
                        </label>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-1 flex border-2 border-gray-200 dark:border-gray-600">
                            <button
                                onClick={() => props.onGlitchAllowedChange(true)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    props.glitchAllowed
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Unrestricted
                            </button>
                            <button
                                onClick={() => props.onGlitchAllowedChange(false)}
                                class={`flex-1 px-2 py-2 rounded-md font-medium transition-all text-xs ${
                                    !props.glitchAllowed
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                No Glitch
                            </button>
                        </div>
                    </div>

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

                    {/* Search */}
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Search Tracks
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by track name..."
                                value={props.searchQuery}
                                onInput={(e) => props.onSearchInput(e.target.value)}
                                class="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
