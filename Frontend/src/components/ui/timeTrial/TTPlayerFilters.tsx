import Select from "../../common/Select";
import SearchInput from "../../common/SearchInput";
import { SlidersHorizontal } from "lucide-solid";
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
        <div class="bg-canvas rounded-lg border border-line p-6">
            <div class="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={20} class="text-fg-subtle" />
                <h2 class="text-xl font-semibold text-fg">Filter Submissions</h2>
            </div>

            <div class="space-y-4">
                {/* Engine Class */}
                <div>
                    <label class="block text-sm font-semibold text-fg-muted mb-2">
                        Engine Class
                    </label>
                    <ToggleGroup<CCOption>
                        value={ccValue()}
                        onChange={handleCCChange}
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            { value: "150", label: "150cc", activeClass: "bg-accent" },
                            { value: "200", label: "200cc", activeClass: "bg-accent" },
                        ]}
                    />
                </div>

                {/* Glitch/Shortcut */}
                <div>
                    <label class="block text-sm font-semibold text-fg-muted mb-2">
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
                                activeClass: "bg-accent",
                            },
                            { value: "glitch", label: "Glitch", activeClass: "bg-accent" },
                        ]}
                    />
                </div>

                {/* Vehicle Type */}
                <div>
                    <label class="block text-sm font-semibold text-fg-muted mb-2">
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
                    <label class="block text-sm font-semibold text-fg-muted mb-2">Shroomless</label>
                    <ToggleGroup<ShroomlessFilter>
                        value={props.shroomlessFilter}
                        onChange={props.onShroomlessFilterChange}
                        activeClass="bg-accent"
                        size="sm"
                        options={[
                            { value: "all", label: "All" },
                            { value: "only", label: "Only" },
                            { value: "exclude", label: "Exclude" },
                        ]}
                    />
                </div>

                {/* Track Search */}
                <SearchInput
                    id="tt-player-track-search"
                    label="Search tracks"
                    placeholder="Track name…"
                    value={props.searchQuery}
                    onValueChange={props.onSearchInput}
                />

                {/* Results Per Page */}
                <Select
                    id="player-page-size"
                    label="Results per page"
                    value={props.pageSize}
                    onChange={(e) => props.onPageSizeChange(parseInt(e.target.value))}
                >
                    <option value="10">10 submissions</option>
                    <option value="25">25 submissions</option>
                    <option value="50">50 submissions</option>
                </Select>
            </div>
        </div>
    );
}
