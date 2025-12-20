import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import { buildRatingFile, parseRatingFile } from "../../../utils/ratingParser";
import { pidToFriendCode } from "../../../utils/friendCodeUtils";
import type { RatingEntry, RatingFile } from "../../../types/tools";
import { AlertBox } from "../../../components/common";
import { leaderboardApi } from "../../../services/api/leaderboard";
import { validateFileName, validateRatingFile } from "../../../utils/fileValidator";

export default function RatingEditorPage() {
    const [ratingFile, setRatingFile] = createSignal<RatingFile | null>(null);
    const [fileName, setFileName] = createSignal<string>("");
    const [selectedRows, setSelectedRows] = createSignal<Set<number>>(new Set());
    const [validationWarnings, setValidationWarnings] = createSignal<string[]>([]);
    const [validationError, setValidationError] = createSignal<string | null>(null);
    
    // Store original FCs when file is loaded
    const [originalFCs, setOriginalFCs] = createSignal<Set<string>>(new Set());

    // Build a map of Friend Code -> array of indices for duplicate detection
    const fcMap = createMemo(() => {
        const file = ratingFile();
        if (!file) return new Map<string, number[]>();

        const map = new Map<string, number[]>();
        file.entries.forEach((entry, idx) => {
            if (entry.profileId > 0) {
                const fc = pidToFriendCode(entry.profileId);
                if (!map.has(fc)) {
                    map.set(fc, []);
                }
                map.get(fc)!.push(idx);
            }
        });
        return map;
    });

    const hasDuplicateFC = (index: number) => {
        const file = ratingFile();
        if (!file) return false;

        const entry = file.entries[index];
        if (entry.profileId <= 0) return false;

        const fc = pidToFriendCode(entry.profileId);
        const indices = fcMap().get(fc);
        return indices ? indices.length > 1 : false;
    };

    // Track which FCs have been found on leaderboard that weren't in original file
    const [takenFCs, setTakenFCs] = createSignal<Set<string>>(new Set());

    const addTakenFC = (fc: string) => {
        if (!originalFCs().has(fc)) {
            setTakenFCs((prev) => new Set([...prev, fc]));
        }
    };

    const handleFileUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setValidationWarnings([]);
        setValidationError(null);
        setRatingFile(null);
        setSelectedRows(new Set<number>());

        // Validate filename extension
        const nameValidation = validateFileName(file.name, ["pul"]);
        if (!nameValidation.valid) {
            setValidationError(nameValidation.error || "Invalid file type");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
        
            // Validate file structure
            const validation = validateRatingFile(arrayBuffer);
            if (!validation.valid) {
                setValidationError(validation.error || "File validation failed");
                return;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                setValidationWarnings(validation.warnings);
            }

            // Parse file (rest of your existing parsing code)
            const parsed = parseRatingFile(arrayBuffer);
            setRatingFile(parsed);
        
            // Store original FCs
            const fcs = new Set<string>();
            parsed.entries.forEach((entry) => {
                if (entry.profileId > 0) {
                    fcs.add(pidToFriendCode(entry.profileId));
                }
            });
            setOriginalFCs(fcs);
            setTakenFCs(new Set<string>());
        } catch (error) {
            setValidationError(error instanceof Error ? error.message : "Failed to parse file");
            console.error("File parsing error:", error);
        }
    };

    const toggleRowSelection = (index: number) => {
        const newSet = new Set(selectedRows());
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedRows(newSet);
    };

    const toggleAllRows = () => {
        const file = ratingFile();
        if (!file) return;

        if (selectedRows().size === file.entries.length) {
            setSelectedRows(new Set<number>());
        } else {
            setSelectedRows(new Set<number>(file.entries.map((_, i) => i)));
        }
    };

    const updateEntry = (index: number, updates: Partial<RatingEntry>) => {
        setRatingFile((prev) => {
            if (!prev) return prev;
            const newEntries = [...prev.entries];
            newEntries[index] = { ...newEntries[index], ...updates };

            // Auto-update flags based on profileId and active state
            const entry = newEntries[index];
            if (entry.profileId > 0 && (entry.flags & 0x1) !== 0) {
                // Keep active
            } else if (entry.profileId <= 0) {
                // Clear active flag if profileId is invalid
                newEntries[index].flags = entry.flags & ~0x1;
            }

            return { ...prev, entries: newEntries };
        });
    };

    const toggleActive = (index: number) => {
        const file = ratingFile();
        if (!file) return;

        const entry = file.entries[index];
        const isActive = (entry.flags & 0x1) !== 0;

        if (entry.profileId > 0) {
            updateEntry(index, {
                flags: isActive ? (entry.flags & ~0x1) : (entry.flags | 0x1)
            });
        }
    };

    const clearSelectedRows = () => {
        const file = ratingFile();
        if (!file) return;

        setRatingFile((prev) => {
            if (!prev) return prev;
            const newEntries = prev.entries.map((entry, idx) => {
                if (selectedRows().has(idx)) {
                    return {
                        ...entry,
                        profileId: 0,
                        vr: 0,
                        br: 0,
                        flags: 0x00000000
                    };
                }
                return entry;
            });
            return { ...prev, entries: newEntries };
        });

        setSelectedRows(new Set<number>());
    };

    const downloadFile = () => {
        const file = ratingFile();
        if (!file) return;

        const buffer = buildRatingFile(file);
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName() || "RRRating.pul";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const isEntryActive = (entry: RatingEntry) => {
        return (entry.flags & 0x1) !== 0 && entry.profileId > 0;
    };

    const getActiveCount = () => {
        const file = ratingFile();
        if (!file) return 0;
        return file.entries.filter(isEntryActive).length;
    };

    const getDuplicateFCCount = () => {
        let count = 0;
        fcMap().forEach((indices) => {
            if (indices.length > 1) {
                count += indices.length;
            }
        });
        return count;
    };

    return (
        <div class="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div class="text-center py-6">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Rating Editor
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Edit RRRating.pul server rating files
                </p>
            </div>

            {/* File Upload */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <label class="flex-1">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Upload RRRating.pul file
                        </span>
                        <input
                            type="file"
                            accept=".pul"
                            onChange={handleFileUpload}
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

                    <Show when={ratingFile()}>
                        <button
                            onClick={downloadFile}
                            class="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            ⬇ Download
                        </button>
                    </Show>
                </div>

                <Show when={ratingFile()}>
                    {(file) => (
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Magic</div>
                                <div class="font-mono text-gray-900 dark:text-white">{file().magic}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Version</div>
                                <div class="font-mono text-gray-900 dark:text-white">{file().version}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Entries</div>
                                <div class="font-mono text-gray-900 dark:text-white">{file().count}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Active Entries</div>
                                <div class="font-mono text-gray-900 dark:text-white">{getActiveCount()}</div>
                            </div>
                            <div class={`rounded-lg p-3 ${getDuplicateFCCount() > 0 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-gray-50 dark:bg-gray-900"}`}>
                                <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Duplicate FCs</div>
                                <div class={`font-mono ${getDuplicateFCCount() > 0 ? "text-yellow-700 dark:text-yellow-400" : "text-gray-900 dark:text-white"}`}>
                                    {getDuplicateFCCount()}
                                </div>
                            </div>
                        </div>
                    )}
                </Show>
            </div>

            {/* Validation Error */}
            <Show when={validationError()}>
                <AlertBox type="error" icon="❌" title="Validation Error">
                    <p class="text-gray-700 dark:text-gray-300">
                        {validationError()}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Please ensure you're uploading a valid RRRating.pul file.
                    </p>
                </AlertBox>
            </Show>

            {/* Validation Warnings */}
            <Show when={validationWarnings().length > 0}>
                <AlertBox type="warning" icon="⚠️" title="Validation Warnings">
                    <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {validationWarnings().map(warning => (
                            <li>{warning}</li>
                        ))}
                    </ul>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
            The file passed validation but has some unusual characteristics. 
            You can proceed with editing, but verify the file if something seems wrong.
                    </p>
                </AlertBox>
            </Show>

            <Show when={!ratingFile() && !validationError()}>
                <AlertBox type="info" icon="ℹ️" title="How to use">
                    <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Upload your <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">RRRating.pul</code> file</li>
                        <li>The file will be automatically validated before loading</li>
                        <li>Click on any cell to edit it directly</li>
                        <li>Toggle "Active" checkbox to enable/disable entries</li>
                        <li>The "RWFC Name" column shows the player name from the leaderboard</li>
                        <li>Select rows and click "Clear Selected" to reset entries</li>
                        <li>Download the modified file when done</li>
                    </ol>
                    <div class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <p class="font-medium mb-2">File Location:</p>
                        <ul class="space-y-1 text-sm">
                            <li><strong>Dolphin:</strong> <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">Dolphin Emulator\Wii\shared2\Pulsar\RetroRewind6\RRRating.pul</code></li>
                            <li><strong>Wii:</strong> <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">SD Card\RetroRewind6\RRRating.pul</code></li>
                        </ul>
                    </div>
                </AlertBox>
            </Show>

            <Show when={ratingFile()}>
                {(file) => (
                    <>
                        <Show when={getDuplicateFCCount() > 0}>
                            <AlertBox type="warning" icon="⚠️" title="Duplicate Friend Codes Detected">
                                <p class="text-gray-700 dark:text-gray-300">
                                    {getDuplicateFCCount()} entries have duplicate Friend Codes within this file.
                                    Duplicate entries are highlighted in yellow in the table below.
                                </p>
                            </AlertBox>
                        </Show>

                        <Show when={takenFCs().size > 0}>
                            <AlertBox type="warning" icon="⚠️" title="Friend Codes Already on Leaderboard">
                                <p class="text-gray-700 dark:text-gray-300 mb-2">
                                    The following Friend Codes are already registered on the RWFC leaderboard and were not in the original file:
                                </p>
                                <div class="flex flex-wrap gap-2 font-mono text-sm">
                                    {Array.from(takenFCs()).map((fc) => (
                                        <span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded">
                                            {fc}
                                        </span>
                                    ))}
                                </div>
                            </AlertBox>
                        </Show>

                        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Toolbar */}
                            <div class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div class="text-sm text-gray-600 dark:text-gray-400">
                                    <Show when={selectedRows().size > 0} fallback="No rows selected">
                                        {selectedRows().size} row(s) selected
                                    </Show>
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        onClick={toggleAllRows}
                                        class="px-3 py-1.5 text-sm font-medium rounded-lg
                                            bg-gray-200 dark:bg-gray-700
                                            text-gray-700 dark:text-gray-300
                                            hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {selectedRows().size === file().entries.length ? "Deselect All" : "Select All"}
                                    </button>
                                    <button
                                        onClick={clearSelectedRows}
                                        disabled={selectedRows().size === 0}
                                        class="px-3 py-1.5 text-sm font-medium rounded-lg
                                            bg-red-600 hover:bg-red-700
                                            text-white
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear Selected
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table class="w-full text-sm">
                                    <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                                        <tr class="border-b border-gray-200 dark:border-gray-700">
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-12">#</th>
                                            <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-12">Sel</th>
                                            <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-20">Active</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Profile ID</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Friend Code</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">RWFC Name</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">VR</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">BR</th>
                                            <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Flags</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                        <For each={file().entries}>
                                            {(entry, idx) => {
                                                const isActive = () => isEntryActive(entry);
                                                const isSelected = () => selectedRows().has(idx());
                                                const isDuplicate = () => hasDuplicateFC(idx());
                                                const friendCode = () => entry.profileId > 0 ? pidToFriendCode(entry.profileId) : "—";

                                                // Fetch player name from leaderboard
                                                const [playerData] = createResource(
                                                    () => entry.profileId > 0 ? friendCode() : null,
                                                    async (fc) => {
                                                        try {
                                                            const player = await leaderboardApi.getPlayer(fc);
                                                            // Mark as taken if not in original file
                                                            if (!originalFCs().has(fc)) {
                                                                addTakenFC(fc);
                                                            }
                                                            return player.name;
                                                        } catch {
                                                            return null;
                                                        }
                                                    }
                                                );

                                                // Local editing state for each field
                                                const [editingProfileId, setEditingProfileId] = createSignal<string>(entry.profileId.toString());
                                                const [editingVR, setEditingVR] = createSignal<string>(entry.vr.toFixed(2));
                                                const [editingBR, setEditingBR] = createSignal<string>(entry.br.toFixed(2));
                                                const [editingFlags, setEditingFlags] = createSignal<string>(`0x${(entry.flags >>> 0).toString(16).padStart(8, "0")}`);

                                                // Update local state when entry changes externally
                                                createEffect(() => {
                                                    setEditingProfileId(entry.profileId.toString());
                                                    setEditingVR(entry.vr.toFixed(2));
                                                    setEditingBR(entry.br.toFixed(2));
                                                    setEditingFlags(`0x${(entry.flags >>> 0).toString(16).padStart(8, "0")}`);
                                                });

                                                const commitProfileId = () => {
                                                    const value = parseInt(editingProfileId()) || 0;
                                                    const clampedValue = Math.max(0, Math.min(1000000000, value));
                                                    updateEntry(idx(), { profileId: clampedValue });
                                                };

                                                const commitVR = () => {
                                                    const value = parseFloat(editingVR()) || 0;
                                                    updateEntry(idx(), { vr: Math.max(0, Math.min(10000, value)) });
                                                };

                                                const commitBR = () => {
                                                    const value = parseFloat(editingBR()) || 0;
                                                    updateEntry(idx(), { br: Math.max(0, Math.min(10000, value)) });
                                                };

                                                const commitFlags = () => {
                                                    const hex = editingFlags().replace(/^0x/i, "");
                                                    const value = parseInt(hex, 16) || 0;
                                                    updateEntry(idx(), { flags: value >>> 0 });
                                                };

                                                return (
                                                    <tr
                                                        class={`${
                                                            isSelected() ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                        } ${
                                                            isDuplicate() ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                                                        } ${
                                                            !isActive() && entry.profileId > 0 ? "opacity-60" : ""
                                                        } hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
                                                    >
                                                        <td class="px-4 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                                                            {idx()}
                                                        </td>
                                                        <td class="px-4 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected()}
                                                                onChange={() => toggleRowSelection(idx())}
                                                                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td class="px-4 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isActive()}
                                                                onChange={() => toggleActive(idx())}
                                                                disabled={entry.profileId <= 0}
                                                                class="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td class="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={editingProfileId()}
                                                                onInput={(e) => setEditingProfileId(e.currentTarget.value)}
                                                                onBlur={commitProfileId}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        commitProfileId();
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                class="w-full px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                        <td class="px-4 py-2 font-mono text-xs">
                                                            <span class={isDuplicate() ? "text-yellow-700 dark:text-yellow-400 font-semibold" : "text-gray-600 dark:text-gray-400"}>
                                                                {friendCode()}
                                                                <Show when={isDuplicate()}>
                                                                    <span class="ml-2">⚠️</span>
                                                                </Show>
                                                            </span>
                                                        </td>
                                                        <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <Show when={playerData.loading}>
                                                                <span class="text-gray-400 dark:text-gray-500 text-xs">Loading...</span>
                                                            </Show>
                                                            <Show when={!playerData.loading && playerData()}>
                                                                <span class={takenFCs().has(friendCode()) ? "text-yellow-700 dark:text-yellow-400 font-semibold" : ""}>
                                                                    {playerData()}
                                                                    <Show when={takenFCs().has(friendCode())}>
                                                                        <span class="ml-2">⚠️</span>
                                                                    </Show>
                                                                </span>
                                                            </Show>
                                                            <Show when={!playerData.loading && !playerData() && entry.profileId > 0}>
                                                                <span class="text-gray-400 dark:text-gray-500 text-xs italic">Not found</span>
                                                            </Show>
                                                        </td>
                                                        <td class="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={editingVR()}
                                                                onInput={(e) => setEditingVR(e.currentTarget.value)}
                                                                onBlur={commitVR}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        commitVR();
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                class="w-full px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                ×100: {Math.round(entry.vr * 100)}
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={editingBR()}
                                                                onInput={(e) => setEditingBR(e.currentTarget.value)}
                                                                onBlur={commitBR}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        commitBR();
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                class="w-full px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                ×100: {Math.round(entry.br * 100)}
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={editingFlags()}
                                                                onInput={(e) => setEditingFlags(e.currentTarget.value)}
                                                                onBlur={commitFlags}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        commitFlags();
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                class="w-full px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </Show>

            {/* Info Box */}
            <Show when={ratingFile()}>
                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div class="flex items-start gap-4">
                        <div class="text-3xl">ℹ️</div>
                        <div class="text-sm text-gray-700 dark:text-gray-300">
                            <p class="font-medium mb-2">File Format Notes:</p>
                            <ul class="list-disc list-inside space-y-1">
                                <li><strong>Profile ID:</strong> Must be &gt; 0 for an active entry (0–1,000,000,000)</li>
                                <li><strong>RWFC Name:</strong> Automatically fetched from the leaderboard for verification</li>
                                <li><strong>VR/BR:</strong> Float values (0.01–10000.00); ×100 shows integer representation</li>
                                <li><strong>Flags:</strong> Bit 0 (0x1) = hasData; toggle "Active" to manage automatically</li>
                                <li><strong>Active:</strong> Entry is active if Profile ID &gt; 0 AND flags bit 0 is set</li>
                                <li><strong>Warnings:</strong> Yellow highlights indicate duplicate FCs in the file or FCs already registered on the leaderboard</li>
                                <li><strong>File Validation:</strong> Files are automatically validated on upload to prevent corruption</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}