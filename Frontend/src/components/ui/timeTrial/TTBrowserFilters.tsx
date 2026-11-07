import { Search } from "lucide-solid";
import { ShroomlessFilter, VehicleFilter } from "../../../types/timeTrial";
import ToggleGroup from "../../common/ToggleGroup";

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

// Local string keys used by ToggleGroup for number/boolean filter values
type CCOption = "150" | "200";
type GlitchOption = "unrestricted" | "no-glitch";

export default function TTBrowserFilters(props: TTBrowserFiltersProps) {
    const ccValue = (): CCOption => String(props.selectedCC) as CCOption;
    const glitchValue = (): GlitchOption => (props.glitchAllowed ? "unrestricted" : "no-glitch");

    return (
        <div class="bg-canvas rounded-lg border border-line overflow-hidden">
            {/* Header */}
            <div class="px-4 sm:px-6 py-4 bg-surface border-b border-line">
                <div class="flex items-center gap-3">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-semibold text-fg">Browse Tracks</h2>
                        <p class="text-gray-600 dark:text-white/80 text-xs sm:text-sm">
                            {props.selectedCC}cc •{" "}
                            {!props.glitchAllowed ? "Non-Glitch/Shortcut" : "Unrestricted"} •{" "}
                            {props.vehicleFilter !== "all"
                                ? props.vehicleFilter.charAt(0).toUpperCase() +
                                  props.vehicleFilter.slice(1)
                                : "All Vehicles"}{" "}
                            •{" "}
                            {props.shroomlessFilter === "only"
                                ? "Shroomless"
                                : props.shroomlessFilter === "exclude"
                                  ? "No Shroomless"
                                  : "All Categories"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div class="bg-surface p-4 border-b-2 border-line">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Track Category */}
                    <div>
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
                            Track Category
                        </label>
                        <ToggleGroup<"retro" | "custom">
                            value={props.selectedCategory}
                            onChange={props.onCategoryChange}
                            options={[
                                { value: "retro", label: "Retro" },
                                { value: "custom", label: "Custom" },
                            ]}
                        />
                    </div>

                    {/* Engine Class */}
                    <div>
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
                            Engine Class
                        </label>
                        <ToggleGroup<CCOption>
                            value={ccValue()}
                            onChange={(v) => props.onCCChange(Number(v) as 150 | 200)}
                            options={[
                                { value: "150", label: "150cc" },
                                { value: "200", label: "200cc" },
                            ]}
                        />
                    </div>

                    {/* Category Type */}
                    <div>
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
                            Category Type
                        </label>
                        <ToggleGroup<GlitchOption>
                            value={glitchValue()}
                            onChange={(v) => props.onGlitchAllowedChange(v === "unrestricted")}
                            options={[
                                { value: "unrestricted", label: "Unrestricted" },
                                {
                                    value: "no-glitch",
                                    label: "No Glitch",
                                },
                            ]}
                        />
                    </div>

                    {/* Vehicle Type */}
                    <div>
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
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
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
                            Shroomless
                        </label>
                        <ToggleGroup<ShroomlessFilter>
                            value={props.shroomlessFilter}
                            onChange={props.onShroomlessFilterChange}
                            options={[
                                { value: "all", label: "All" },
                                { value: "only", label: "Only" },
                                { value: "exclude", label: "Exclude" },
                            ]}
                        />
                    </div>

                    {/* Search */}
                    <div>
                        <label class="block text-xs font-semibold text-fg-muted mb-1">
                            Search Tracks
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} class="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by track name..."
                                value={props.searchQuery}
                                onInput={(e) => props.onSearchInput(e.target.value)}
                                class="w-full pl-9 pr-3 py-2 border border-line-strong rounded-lg bg-canvas text-fg placeholder:text-fg-subtle text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
