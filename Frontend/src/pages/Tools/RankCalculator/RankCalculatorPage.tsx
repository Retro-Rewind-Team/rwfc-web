import { createMemo, createSignal, For, Show } from "solid-js";
import { parseRksysFile } from "../../../utils/rksysParser";
import { parseRatingFile } from "../../../utils/ratingParser";
import { calculateNeededStats, computeContributions, computeScore } from "../../../utils/rankCalculator";
import type { RksysLicense } from "../../../types/tools";
import { AlertBox } from "../../../components/common";

const RANK_ICONS = [
    null,
    "/images/ranks/E.png",
    "/images/ranks/D.png",
    "/images/ranks/C.png",
    "/images/ranks/B.png",
    "/images/ranks/A.png",
    "/images/ranks/1star.png",
    "/images/ranks/2star.png",
    "/images/ranks/3star.png",
    "/images/ranks/Crown.png",
];

export default function RankCalculatorPage() {
    const [baseLicenses, setBaseLicenses] = createSignal<RksysLicense[]>([]);
    const [selectedLicense, setSelectedLicense] = createSignal<number>(0);
    const [whatIfMode, setWhatIfMode] = createSignal(true);
    const [editedStats, setEditedStats] = createSignal<Partial<RksysLicense>>({});
    const [rksysFileName, setRksysFileName] = createSignal<string>("");
    const [ratingFileName, setRatingFileName] = createSignal<string>("");
    const [vrOverrides, setVrOverrides] = createSignal<Map<number, number>>(new Map());
    const [hasRksys, setHasRksys] = createSignal(false);
    const [hasRating, setHasRating] = createSignal(false);

    // Apply VR overrides from rating file to licenses
    const licenses = createMemo(() => {
        const base = baseLicenses();
        const overrides = vrOverrides();
        
        if (!hasRating() || overrides.size === 0) {
            return base;
        }

        return base.map(lic => {
            const vrRating = overrides.get(lic.profileId);
            if (vrRating !== undefined) {
                // Convert internal VR (0-10000) to fancy VR (0-1000000)
                const vrFancy = Math.round(vrRating * 100);
                return { ...lic, vrPoints: vrFancy };
            }
            return lic;
        });
    });

    const handleRksysUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        setRksysFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const parsedLicenses = parseRksysFile(arrayBuffer);
            setBaseLicenses(parsedLicenses);
            setSelectedLicense(0);
            setEditedStats({});
            setHasRksys(true);
        } catch (error) {
            console.error("Failed to parse rksys.dat:", error);
            alert("Failed to parse rksys.dat file. Please check the file format.");
        }
    };

    const handleRatingUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        setRatingFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const ratingFile = parseRatingFile(arrayBuffer);
            
            // Build VR override map
            const vrMap = new Map<number, number>();
            for (const entry of ratingFile.entries) {
                if (entry.profileId > 0 && isFinite(entry.vr)) {
                    vrMap.set(entry.profileId, entry.vr);
                }
            }
            
            setVrOverrides(vrMap);
            setHasRating(true);
            
            // Reset edited stats to reflect new VR values
            setEditedStats({});
        } catch (error) {
            console.error("Failed to parse RRRating.pul:", error);
            alert("Failed to parse RRRating.pul file. Please check the file format.");
        }
    };

    const currentLicense = createMemo(() => {
        const base = licenses()[selectedLicense()];
        if (!base) return null;
        
        if (whatIfMode()) {
            return { ...base, ...editedStats() };
        }
        return base;
    });

    const score = createMemo(() => {
        const license = currentLicense();
        return license ? computeScore(license) : null;
    });

    const needed = createMemo(() => {
        const license = currentLicense();
        return license ? calculateNeededStats(license) : null;
    });

    const contributions = createMemo(() => {
        const license = currentLicense();
        return license ? computeContributions(license) : null;
    });

    const resetWhatIf = () => {
        setEditedStats({});
    };

    const updateStat = (field: keyof RksysLicense, value: number) => {
        setEditedStats((prev) => ({ ...prev, [field]: value }));
    };

    const formatMeters = (m: number) => {
        if (!isFinite(m)) return "—";
        if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
        return `${Math.round(m)} m`;
    };

    const getFeasibilityClass = (feasibility: string) => {
        switch (feasibility) {
        case "ok": return "text-green-600 dark:text-green-400";
        case "warn": return "text-yellow-600 dark:text-yellow-400";
        case "bad": return "text-red-600 dark:text-red-400";
        default: return "text-gray-600 dark:text-gray-400";
        }
    };

    const getVrWarning = () => {
        if (!hasRksys()) return "";
        if (!hasRating()) return " (VR from rksys.dat only — load RRRating.pul for accurate values)";
        
        const license = licenses()[selectedLicense()];
        if (!license) return "";
        
        const override = vrOverrides().get(license.profileId);
        if (override === undefined) {
            return " (no RRRating entry for this profile ID)";
        }
        
        return "";
    };

    return (
        <div class="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div class="text-center py-6">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Rank Calculator
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Analyze your rksys.dat save file and see what you need for the next rank
                </p>
            </div>

            {/* File Upload Section */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div>
                    <label class="block">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Upload rksys.dat file
                        </span>
                        <input
                            type="file"
                            accept=".dat"
                            onChange={handleRksysUpload}
                            class="block w-full text-sm text-gray-600 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-blue-900/30 dark:file:text-blue-400
                                dark:hover:file:bg-blue-900/50"
                        />
                    </label>
                    <Show when={rksysFileName()}>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Loaded: {rksysFileName()}
                        </p>
                    </Show>
                </div>

                <div>
                    <label class="block">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Upload RRRating.pul file (optional - for accurate VR)
                        </span>
                        <input
                            type="file"
                            accept=".pul"
                            onChange={handleRatingUpload}
                            class="block w-full text-sm text-gray-600 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-purple-50 file:text-purple-700
                                hover:file:bg-purple-100
                                dark:file:bg-purple-900/30 dark:file:text-purple-400
                                dark:hover:file:bg-purple-900/50"
                        />
                    </label>
                    <Show when={ratingFileName()}>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Loaded: {ratingFileName()} ({vrOverrides().size} VR overrides)
                        </p>
                    </Show>
                </div>
            </div>

            <Show when={licenses().length === 0}>
                <AlertBox type="info" icon="ℹ️" title="How to use">
                    <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Upload your <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">rksys.dat</code> file (found in your Wii save data)</li>
                        <li>(Optional) Upload <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">RRRating.pul</code> for accurate VR values</li>
                        <li>View your current rank and stats for each license</li>
                        <li>Enable "What If?" mode to preview stat changes</li>
                        <li>See what stats you need to reach the next rank tier</li>
                    </ol>
                </AlertBox>
            </Show>

            <Show when={licenses().length > 0}>
                {/* License Tabs */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <For each={licenses()}>
                            {(license, idx) => (
                                <button
                                    onClick={() => {
                                        setSelectedLicense(idx());
                                        setEditedStats({});
                                    }}
                                    class={`flex-shrink-0 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                                        selectedLicense() === idx()
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {idx() + 1}: {license.name || `License ${idx() + 1}`}
                                </button>
                            )}
                        </For>
                    </div>

                    {/* What If Controls */}
                    <div class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={whatIfMode()}
                                    onChange={(e) => {
                                        setWhatIfMode(e.currentTarget.checked);
                                        if (!e.currentTarget.checked) {
                                            resetWhatIf();
                                        }
                                    }}
                                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    What If? mode
                                </span>
                            </label>
                            <button
                                onClick={resetWhatIf}
                                disabled={!whatIfMode()}
                                class="px-3 py-1.5 text-sm font-medium rounded-lg
                                    bg-gray-200 dark:bg-gray-700
                                    text-gray-700 dark:text-gray-300
                                    hover:bg-gray-300 dark:hover:bg-gray-600
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-colors"
                            >
                                Reset edits
                            </button>
                        </div>
                    </div>

                    <Show when={currentLicense()}>
                        {(license) => {
                            const currentScore = score();
                            const neededStats = needed();
                            const contribs = contributions();

                            return (
                                <div class="p-6 space-y-6">
                                    {/* License Info */}
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span class="text-gray-600 dark:text-gray-400">Mii Name:</span>
                                            <span class="ml-2 font-medium text-gray-900 dark:text-white">{license().name}</span>
                                        </div>
                                        <div>
                                            <span class="text-gray-600 dark:text-gray-400">Friend Code:</span>
                                            <span class="ml-2 font-mono text-gray-900 dark:text-white">{license().friendCode}</span>
                                        </div>
                                    </div>

                                    {/* Score Card */}
                                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                    Current Rank
                                                </h3>
                                                <div class="flex items-center gap-3">
                                                    <span class="text-4xl font-bold text-gray-900 dark:text-white">
                                                        {currentScore?.rankLabel}
                                                    </span>
                                                    <Show when={currentScore && currentScore.rank > 0}>
                                                        <img 
                                                            src={RANK_ICONS[currentScore!.rank] || ""} 
                                                            alt={`Rank ${currentScore!.rankLabel}`}
                                                            class="h-10 w-auto"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                    </Show>
                                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                                        Score: {currentScore?.score.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            <Show when={neededStats?.threshold !== null}>
                                                <div class="text-right">
                                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        Next Rank At
                                                    </h3>
                                                    <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                        {neededStats?.threshold}
                                                    </span>
                                                </div>
                                            </Show>
                                        </div>
                                        <Show when={!currentScore?.meetsRaceReq}>
                                            <p class="text-sm text-yellow-700 dark:text-yellow-400 mt-3">
                                                ⚠ Needs at least 100 VS races for a non-zero rank (currently {currentScore?.totalVs})
                                            </p>
                                        </Show>
                                    </div>

                                    {/* Stats Table */}
                                    <div class="overflow-x-auto">
                                        <table class="w-full">
                                            <thead class="bg-gray-50 dark:bg-gray-900">
                                                <tr>
                                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Stat
                                                    </th>
                                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Current
                                                    </th>
                                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Needed (for next rank)
                                                    </th>
                                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Contribution
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                                {/* VR Row */}
                                                <tr>
                                                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        <div>
                                                            VR (Race Rating)
                                                            <span class="text-xs text-gray-500 dark:text-gray-400 block">
                                                                {getVrWarning()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        <Show 
                                                            when={whatIfMode()} 
                                                            fallback={<span>{license().vrPoints.toLocaleString()} VR</span>}
                                                        >
                                                            <input
                                                                type="number"
                                                                value={license().vrPoints}
                                                                onInput={(e) => updateStat("vrPoints", parseInt(e.currentTarget.value) || 0)}
                                                                min="0"
                                                                max="1000000"
                                                                step="100"
                                                                class="w-32 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            />
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <Show when={neededStats?.byStat?.VR} fallback="—">
                                                            {(stat) => {
                                                                const needed = stat();
                                                                const current = license().vrPoints;
                                                                return needed.neededRaw <= current ? (
                                                                    <span class="text-green-600 dark:text-green-400">✓ Sufficient</span>
                                                                ) : (
                                                                    <span class={getFeasibilityClass(needed.feasibility)}>
                                                                        {needed.neededRaw.toLocaleString()} VR
                                                                    </span>
                                                                );
                                                            }}
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <div>{contribs?.VR.points.toFixed(2)} pts</div>
                                                        <div class="text-xs">~{contribs?.VR.share.toFixed(1)}% of score</div>
                                                    </td>
                                                </tr>

                                                {/* Win % Row */}
                                                <tr>
                                                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        VS Win %
                                                    </td>
                                                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        <div class="space-y-1">
                                                            <div>{currentScore?.winPct.toFixed(2)}%</div>
                                                            <Show when={whatIfMode()}>
                                                                <div class="flex gap-2 text-xs">
                                                                    <input
                                                                        type="number"
                                                                        value={license().vsWins}
                                                                        onInput={(e) => updateStat("vsWins", parseInt(e.currentTarget.value) || 0)}
                                                                        min="0"
                                                                        placeholder="Wins"
                                                                        class="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={license().vsLosses}
                                                                        onInput={(e) => updateStat("vsLosses", parseInt(e.currentTarget.value) || 0)}
                                                                        min="0"
                                                                        placeholder="Losses"
                                                                        class="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                                    />
                                                                </div>
                                                            </Show>
                                                            <div class="text-xs text-gray-500">
                                                                W: {license().vsWins} / L: {license().vsLosses}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <Show when={neededStats?.byStat?.WinPct} fallback="—">
                                                            {(stat) => {
                                                                const needed = stat();
                                                                const current = currentScore?.winPct || 0;
                                                                return needed.neededRaw <= current ? (
                                                                    <span class="text-green-600 dark:text-green-400">✓ Sufficient</span>
                                                                ) : (
                                                                    <div class="space-y-1">
                                                                        <span class={getFeasibilityClass(needed.feasibility)}>
                                                                            {needed.neededRaw.toFixed(2)}%
                                                                        </span>
                                                                        <Show when={needed.extraWins && needed.extraWins !== "—"}>
                                                                            <div class="text-xs text-gray-500">
                                                                                Min +{needed.extraWins} wins
                                                                            </div>
                                                                        </Show>
                                                                    </div>
                                                                );
                                                            }}
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <div>{contribs?.RWIN.points.toFixed(2)} pts</div>
                                                        <div class="text-xs">~{contribs?.RWIN.share.toFixed(1)}% of score</div>
                                                    </td>
                                                </tr>

                                                {/* Times 1st Row */}
                                                <tr>
                                                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        Times 1st Place
                                                    </td>
                                                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        <Show 
                                                            when={whatIfMode()} 
                                                            fallback={<span>{license().firsts.toLocaleString()}</span>}
                                                        >
                                                            <input
                                                                type="number"
                                                                value={license().firsts}
                                                                onInput={(e) => updateStat("firsts", parseInt(e.currentTarget.value) || 0)}
                                                                min="0"
                                                                max="2725"
                                                                class="w-32 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            />
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <Show when={neededStats?.byStat?.Firsts} fallback="—">
                                                            {(stat) => {
                                                                const needed = stat();
                                                                const current = license().firsts;
                                                                return needed.neededRaw <= current ? (
                                                                    <span class="text-green-600 dark:text-green-400">✓ Sufficient</span>
                                                                ) : (
                                                                    <span class={getFeasibilityClass(needed.feasibility)}>
                                                                        {needed.neededRaw.toLocaleString()} times
                                                                    </span>
                                                                );
                                                            }}
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <div>{contribs?.FIRSTS.points.toFixed(2)} pts</div>
                                                        <div class="text-xs">~{contribs?.FIRSTS.share.toFixed(1)}% of score</div>
                                                    </td>
                                                </tr>

                                                {/* Distance Row */}
                                                <tr>
                                                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        Distance Travelled
                                                    </td>
                                                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        <Show 
                                                            when={whatIfMode()} 
                                                            fallback={<span>{formatMeters(license().distance)}</span>}
                                                        >
                                                            <input
                                                                type="number"
                                                                value={Math.round(license().distance)}
                                                                onInput={(e) => updateStat("distance", parseFloat(e.currentTarget.value) || 0)}
                                                                min="0"
                                                                max="100000"
                                                                class="w-32 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            />
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <Show when={neededStats?.byStat?.Distance} fallback="—">
                                                            {(stat) => {
                                                                const needed = stat();
                                                                const current = license().distance;
                                                                return needed.neededRaw <= current ? (
                                                                    <span class="text-green-600 dark:text-green-400">✓ Sufficient</span>
                                                                ) : (
                                                                    <span class={getFeasibilityClass(needed.feasibility)}>
                                                                        {formatMeters(needed.neededRaw)}
                                                                    </span>
                                                                );
                                                            }}
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <div>{contribs?.DIST.points.toFixed(2)} pts</div>
                                                        <div class="text-xs">~{contribs?.DIST.share.toFixed(1)}% of score</div>
                                                    </td>
                                                </tr>

                                                {/* Distance 1st Row */}
                                                <tr>
                                                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        Distance while 1st
                                                    </td>
                                                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                        <Show 
                                                            when={whatIfMode()} 
                                                            fallback={<span>{formatMeters(license().distance1st)}</span>}
                                                        >
                                                            <input
                                                                type="number"
                                                                value={Math.round(license().distance1st)}
                                                                onInput={(e) => updateStat("distance1st", parseFloat(e.currentTarget.value) || 0)}
                                                                min="0"
                                                                max="25000"
                                                                class="w-32 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            />
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <Show when={neededStats?.byStat?.Dist1st} fallback="—">
                                                            {(stat) => {
                                                                const needed = stat();
                                                                const current = license().distance1st;
                                                                return needed.neededRaw <= current ? (
                                                                    <span class="text-green-600 dark:text-green-400">✓ Sufficient</span>
                                                                ) : (
                                                                    <span class={getFeasibilityClass(needed.feasibility)}>
                                                                        {formatMeters(needed.neededRaw)}
                                                                    </span>
                                                                );
                                                            }}
                                                        </Show>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <div>{contribs?.DIST1ST.points.toFixed(2)} pts</div>
                                                        <div class="text-xs">~{contribs?.DIST1ST.share.toFixed(1)}% of score</div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Info Box */}
                                    <div class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                        <p class="font-medium mb-2">How to read this:</p>
                                        <ul class="list-disc list-inside space-y-1">
                                            <li><strong>Current:</strong> Your stats from the save file (or What If edits)</li>
                                            <li><strong>Needed:</strong> What this stat needs to be (if changed alone) to reach the next rank</li>
                                            <li><strong>Contribution:</strong> How much this stat contributes to your final score (0-100)</li>
                                        </ul>
                                        <p class="mt-3 text-xs">
                                            Contributions sum to your total score. Colors indicate feasibility: 
                                            <span class="text-green-600 dark:text-green-400"> green = achievable</span>, 
                                            <span class="text-yellow-600 dark:text-yellow-400"> yellow = difficult</span>, 
                                            <span class="text-red-600 dark:text-red-400"> red = very difficult</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        }}
                    </Show>
                </div>
            </Show>
        </div>
    );
}