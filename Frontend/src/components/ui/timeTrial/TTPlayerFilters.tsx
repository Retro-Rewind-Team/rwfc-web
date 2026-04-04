import { Search, SlidersHorizontal } from "lucide-solid";
import { ShroomlessFilter, VehicleFilter } from "../../../types/timeTrial";
import ToggleGroup from "../../common/ToggleGroup";

interface TTPlayerFiltersProps {
    selectedCC: 150 | 200 | undefined;
    glitchFilter: boolean | undefined;
    vehicleFilter: VehicleFilter;
    shroomlessFilter: ShroomlessFilter;
    searchQuery: string;
    pageSize: number;
    onCCChange: (cc: 150 | 200 | undefined) => void;
    onGlitchFilterChange: (glitch: boolean | undefined) => void;
    onVehicleFilterChange: (filter: VehicleFilter) => void;
    onShroomlessFilterChange: (filter: ShroomlessFilter) => void;
    onSearchInput: (value: string) => void;
    onPageSizeChange: (size: number) => void;
}

// Local string keys used by ToggleGroup for boolean/undefined filter values
type CCOption = "all" | "150" | "200";
type GlitchOption = "all" | "non-glitch" | "glitch";

export default function TTPlayerFilters(props: TTPlayerFiltersProps) {
    const ccValue = (): CCOption =>
        props.selectedCC === undefined ? "all" : (String(props.selectedCC) as CCOption);

    const glitchValue = (): GlitchOption =>
        props.glitchFilter === undefined ? "all" : props.glitchFilter ? "glitch" : "non-glitch";

    const handleCCChange = (v: CCOption) =>
        props.onCCChange(v === "all" ? undefined : (Number(v) as 150 | 200));

    const handleGlitchChange = (v: GlitchOption) =>
        props.onGlitchFilterChange(v === "all" ? undefined : v === "glitch");

    return (
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={20} class="text-gray-400 dark:text-gray-500" />
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Filter Submissions</h2>
            </div>

            <div class="space-y-4">
                {/* Engine Class */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Engine Class
                    </label>
                    <ToggleGroup<CCOption>
                        value={ccValue()}
                        onChange={handleCCChange}
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            { value: "150", label: "150cc", activeClass: "bg-green-600" },
                            { value: "200", label: "200cc", activeClass: "bg-sky-600" },
                        ]}
                    />
                </div>

                {/* Glitch/Shortcut */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Glitch/Shortcut
                    </label>
                    <ToggleGroup<GlitchOption>
                        value={glitchValue()}
                        onChange={handleGlitchChange}
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            {
                                value: "non-glitch",
                                label: "Non-Glitch",
                                activeClass: "bg-green-600",
                            },
                            { value: "glitch", label: "Glitch", activeClass: "bg-purple-600" },
                        ]}
                    />
                </div>

                {/* Vehicle Type */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Vehicle Type
                    </label>
                    <ToggleGroup<VehicleFilter>
                        value={props.vehicleFilter}
                        onChange={props.onVehicleFilterChange}
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            { value: "karts", label: "Karts" },
                            { value: "bikes", label: "Bikes" },
                        ]}
                    />
                </div>

                {/* Shroomless */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Shroomless
                    </label>
                    <ToggleGroup<ShroomlessFilter>
                        value={props.shroomlessFilter}
                        onChange={props.onShroomlessFilterChange}
                        activeClass="bg-amber-600"
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            { value: "only", label: "Only" },
                            { value: "exclude", label: "Exclude" },
                        ]}
                    />
                </div>

                {/* Track Search */}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Search Tracks
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} class="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by track name..."
                            value={props.searchQuery}
                            onInput={(e) => props.onSearchInput(e.target.value)}
                            class="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Results Per Page */}
                <div>
                    <label
                        for="player-page-size"
                        class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Results Per Page
                    </label>
                    <select
                        id="player-page-size"
                        value={props.pageSize}
                        onChange={(e) => props.onPageSizeChange(parseInt(e.target.value))}
                        class="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="10">10 submissions</option>
                        <option value="25">25 submissions</option>
                        <option value="50">50 submissions</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
