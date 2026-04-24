import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import { buildRatingFile, parseRatingFile } from "../../utils/ratingParser";
import { pidToFriendCode } from "../../utils/friendCodeUtils";
import { validateFileName, validateRatingFile } from "../../utils/fileValidator";
import { triggerBlobDownload } from "../../utils/downloadHelpers";
import type { RatingEntry, RatingFile } from "../../types/tools";
import { AlertBox } from "../../components/common";
import { leaderboardApi } from "../../services/api/leaderboard";
import { Download, TriangleAlert } from "lucide-solid";

export default function RatingEditorPage() {
    const [ratingFile, setRatingFile] = createSignal<RatingFile | null>(null);
    const [fileName, setFileName] = createSignal("RRRating.pul");
    const [selectedRows, setSelectedRows] = createSignal<Set<number>>(new Set());
    const [validationWarnings, setValidationWarnings] = createSignal<string[]>([]);
    const [validationError, setValidationError] = createSignal<string | null>(null);
    const [originalFCs, setOriginalFCs] = createSignal<Set<string>>(new Set());
    const [takenFCs, setTakenFCs] = createSignal<Set<string>>(new Set());

    const fcMap = createMemo(() => {
        const file = ratingFile();
        if (!file) return new Map<string, number[]>();
        const map = new Map<string, number[]>();
        file.entries.forEach((entry, idx) => {
            if (entry.profileId > 0) {
                const fc = pidToFriendCode(entry.profileId);
                if (!map.has(fc)) map.set(fc, []);
                map.get(fc)!.push(idx);
            }
        });
        return map;
    });

    const hasDuplicateFC = (index: number) => {
        const file = ratingFile();
        if (!file || file.entries[index].profileId <= 0) return false;
        const fc = pidToFriendCode(file.entries[index].profileId);
        return (fcMap().get(fc)?.length ?? 0) > 1;
    };

    const handleFileUpload = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setFileName(file.name);
        setValidationWarnings([]);
        setValidationError(null);
        setRatingFile(null);
        setSelectedRows(new Set<number>());

        const nameCheck = validateFileName(file.name, ["pul"]);
        if (!nameCheck.valid) {
            setValidationError(nameCheck.error ?? "Invalid file");
            return;
        }

        try {
            const buf = await file.arrayBuffer();
            const check = validateRatingFile(buf);
            if (!check.valid) {
                setValidationError(check.error ?? "Validation failed");
                return;
            }
            if (check.warnings?.length) setValidationWarnings(check.warnings);

            const parsed = parseRatingFile(buf);
            setRatingFile(parsed);

            const fcs = new Set<string>();
            parsed.entries.forEach((e) => {
                if (e.profileId > 0) fcs.add(pidToFriendCode(e.profileId));
            });
            setOriginalFCs(fcs);
            setTakenFCs(new Set<string>());
        } catch (err) {
            setValidationError(err instanceof Error ? err.message : "Failed to parse file");
        }
    };

    const updateEntry = (index: number, updates: Partial<RatingEntry>) => {
        setRatingFile((prev) => {
            if (!prev) return prev;
            const entries = [...prev.entries];
            entries[index] = { ...entries[index], ...updates };
            const e = entries[index];
            if (e.profileId <= 0) entries[index] = { ...e, flags: e.flags & ~0x1 };
            return { ...prev, entries };
        });
    };

    const toggleActive = (index: number) => {
        const file = ratingFile();
        if (!file) return;
        const e = file.entries[index];
        if (e.profileId <= 0) return;
        updateEntry(index, { flags: (e.flags & 0x1) !== 0 ? e.flags & ~0x1 : e.flags | 0x1 });
    };

    const toggleRowSelection = (index: number) => {
        const s = new Set(selectedRows());
        if (s.has(index)) {
            s.delete(index);
        } else {
            s.add(index);
        }
        setSelectedRows(s);
    };

    const toggleAll = () => {
        if (!ratingFile()) return;
        const visible = visibleEntries();
        setSelectedRows(
            selectedRows().size === visible.length
                ? new Set<number>()
                : new Set<number>(visible.map((e) => e.index)),
        );
    };

    const clearSelected = () => {
        setRatingFile((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                entries: prev.entries.map((e, i) =>
                    selectedRows().has(i) ? { ...e, profileId: 0, vr: 0, br: 0, flags: 0 } : e,
                ),
            };
        });
        setSelectedRows(new Set<number>());
    };

    const download = () => {
        const file = ratingFile();
        if (!file) return;
        triggerBlobDownload(
            new Blob([buildRatingFile(file)], { type: "application/octet-stream" }),
            fileName(),
        );
    };

    const isActive = (e: RatingEntry) => (e.flags & 0x1) !== 0 && e.profileId > 0;
    const filledEntries = createMemo(
        () => ratingFile()?.entries.filter((e) => e.profileId > 0) ?? [],
    );
    const visibleEntries = createMemo(() => ratingFile()?.entries.slice(0, 4) ?? []);
    const activeCount = () => ratingFile()?.entries.filter(isActive).length ?? 0;
    const dupCount = () => {
        let n = 0;
        fcMap().forEach((idxs) => {
            if (idxs.length > 1) n += idxs.length;
        });
        return n;
    };

    return (
        <div class="max-w-7xl mx-auto space-y-6">
            <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Rating Editor</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Edit your{" "}
                    <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        RRRating.pul
                    </code>{" "}
                    file. This is a personal file stored on your save, with one entry per license
                    (up to 4).
                </p>
            </div>

            {/* Upload + actions */}
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center gap-4">
                <label class="flex-1 min-w-0">
                    <span class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        RRRating.pul
                    </span>
                    <input
                        type="file"
                        accept=".pul"
                        onChange={handleFileUpload}
                        class="block w-full text-sm text-gray-600 dark:text-gray-400
                            file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                            file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400
                            dark:hover:file:bg-blue-900/50"
                    />
                </label>
                <Show when={ratingFile()}>
                    <button
                        type="button"
                        onClick={download}
                        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                    >
                        <Download size={14} /> Download
                    </button>
                </Show>
            </div>

            {/* File summary */}
            <Show when={ratingFile()}>
                {(_) => (
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            {
                                label: "License Slots",
                                value: `${filledEntries().length} / 4`,
                                mono: true,
                            },
                            { label: "Active", value: activeCount().toLocaleString(), mono: true },
                            {
                                label: "Duplicate FCs",
                                value: dupCount().toLocaleString(),
                                mono: true,
                                warn: dupCount() > 0,
                            },
                        ].map((s) => (
                            <div
                                class={`rounded-lg p-3 border ${s.warn ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"}`}
                            >
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {s.label}
                                </div>
                                <div
                                    class={`font-semibold ${s.warn ? "text-yellow-700 dark:text-yellow-400" : "text-gray-900 dark:text-white"} ${s.mono ? "font-mono" : ""}`}
                                >
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Show>

            <Show when={validationError()}>
                <AlertBox type="error" title="Validation Error">
                    <p>{validationError()}</p>
                </AlertBox>
            </Show>

            <Show when={validationWarnings().length > 0}>
                <AlertBox type="warning" title="Validation Warnings">
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        {validationWarnings().map((w) => (
                            <li>{w}</li>
                        ))}
                    </ul>
                </AlertBox>
            </Show>

            <Show when={!ratingFile() && !validationError()}>
                <AlertBox type="info" title="How to use">
                    <ol class="list-decimal list-inside space-y-1.5 text-sm">
                        <li>
                            Upload your <code class="font-mono">RRRating.pul</code> file
                        </li>
                        <li>
                            Edit Profile IDs, VR, and BR directly in the table (one row per license)
                        </li>
                        <li>Use the "Active" checkbox to enable or disable a license slot</li>
                        <li>
                            Click the down arrow next to VR to fetch the current leaderboard VR for
                            that license
                        </li>
                        <li>Select rows and clear them to zero out a slot</li>
                        <li>Download the modified file when done</li>
                    </ol>
                    <div class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 text-sm space-y-1">
                        <p class="font-medium">File location:</p>
                        <p>
                            <strong>Dolphin:</strong>{" "}
                            <code class="font-mono">
                                Dolphin Emulator\Wii\shared2\Pulsar\RetroRewind6\RRRating.pul
                            </code>
                        </p>
                        <p>
                            <strong>Wii:</strong>{" "}
                            <code class="font-mono">SD Card\RetroRewind6\RRRating.pul</code>
                        </p>
                    </div>
                </AlertBox>
            </Show>

            <Show when={ratingFile()}>
                {(_) => (
                    <>
                        <Show when={dupCount() > 0}>
                            <AlertBox type="warning" title="Duplicate Friend Codes">
                                <p>
                                    {dupCount()} entries share a Friend Code with another entry.
                                    They are highlighted below.
                                </p>
                            </AlertBox>
                        </Show>
                        <Show when={takenFCs().size > 0}>
                            <AlertBox type="warning" title="FCs Already on Leaderboard">
                                <p class="mb-2">
                                    These Friend Codes are registered on the leaderboard but were
                                    not in the original file:
                                </p>
                                <div class="flex flex-wrap gap-1.5 font-mono text-xs">
                                    {Array.from(takenFCs()).map((fc) => (
                                        <span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded">
                                            {fc}
                                        </span>
                                    ))}
                                </div>
                            </AlertBox>
                        </Show>

                        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Toolbar */}
                            <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                                <span class="text-sm text-gray-500 dark:text-gray-400">
                                    <Show
                                        when={selectedRows().size > 0}
                                        fallback="No rows selected"
                                    >
                                        {selectedRows().size} selected
                                    </Show>
                                </span>
                                <div class="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {selectedRows().size === visibleEntries().length
                                            ? "Deselect All"
                                            : "Select All"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelected}
                                        disabled={selectedRows().size === 0}
                                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Clear Selected
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table class="w-full text-sm">
                                    <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            {[
                                                "#",
                                                "Sel",
                                                "Active",
                                                "Profile ID",
                                                "Friend Code",
                                                "RWFC Name",
                                                "VR (pts)",
                                                "BR (pts)",
                                            ].map((h) => (
                                                <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        <For each={visibleEntries()}>
                                            {(entry) => {
                                                const idx = () => entry.index;
                                                const active = () => isActive(entry);
                                                const selected = () => selectedRows().has(idx());
                                                const dup = () => hasDuplicateFC(idx());
                                                const fc = () =>
                                                    entry.profileId > 0
                                                        ? pidToFriendCode(entry.profileId)
                                                        : "";

                                                const [playerData] = createResource(
                                                    () => (entry.profileId > 0 ? fc() : null),
                                                    async (code) => {
                                                        try {
                                                            const p =
                                                                await leaderboardApi.getPlayer(
                                                                    code,
                                                                );
                                                            if (!originalFCs().has(code))
                                                                setTakenFCs(
                                                                    (prev) =>
                                                                        new Set([...prev, code]),
                                                                );
                                                            return p;
                                                        } catch {
                                                            return null;
                                                        }
                                                    },
                                                );

                                                const [editPid, setEditPid] = createSignal(
                                                    String(entry.profileId),
                                                );
                                                const [editVr, setEditVr] = createSignal(
                                                    String(Math.round(entry.vr * 100)),
                                                );
                                                const [editBr, setEditBr] = createSignal(
                                                    String(Math.round(entry.br * 100)),
                                                );
                                                const [fetchingVr, setFetchingVr] =
                                                    createSignal(false);

                                                createEffect(() => {
                                                    setEditPid(String(entry.profileId));
                                                    setEditVr(String(Math.round(entry.vr * 100)));
                                                    setEditBr(String(Math.round(entry.br * 100)));
                                                });

                                                const commitPid = () => {
                                                    const v = Math.max(
                                                        0,
                                                        Math.min(
                                                            1_000_000_000,
                                                            parseInt(editPid()) || 0,
                                                        ),
                                                    );
                                                    updateEntry(idx(), { profileId: v });
                                                };

                                                const commitVr = () => {
                                                    const pts = Math.max(
                                                        0,
                                                        Math.min(
                                                            1_000_000,
                                                            parseInt(editVr()) || 0,
                                                        ),
                                                    );
                                                    setEditVr(String(pts));
                                                    updateEntry(idx(), { vr: pts / 100 });
                                                };

                                                const commitBr = () => {
                                                    const pts = Math.max(
                                                        0,
                                                        Math.min(
                                                            1_000_000,
                                                            parseInt(editBr()) || 0,
                                                        ),
                                                    );
                                                    setEditBr(String(pts));
                                                    updateEntry(idx(), { br: pts / 100 });
                                                };

                                                const fetchVr = async () => {
                                                    if (entry.profileId <= 0) return;
                                                    const code = fc();
                                                    setFetchingVr(true);
                                                    try {
                                                        const p =
                                                            await leaderboardApi.getPlayer(code);
                                                        const pts = Math.round(p.vr);
                                                        setEditVr(String(pts));
                                                        updateEntry(idx(), { vr: pts / 100 });
                                                    } catch {
                                                        // silently fail
                                                    } finally {
                                                        setFetchingVr(false);
                                                    }
                                                };

                                                const inputCls =
                                                    "w-full px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent";
                                                const onEnter =
                                                    (cb: () => void) => (e: KeyboardEvent) => {
                                                        if (e.key === "Enter") {
                                                            cb();
                                                            (e.target as HTMLElement).blur();
                                                        }
                                                    };

                                                return (
                                                    <tr
                                                        class={`${selected() ? "bg-blue-50 dark:bg-blue-900/20" : dup() ? "bg-yellow-50/60 dark:bg-yellow-900/10" : ""} hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors`}
                                                    >
                                                        <td class="px-3 py-1.5 font-mono text-xs text-gray-400">
                                                            {idx()}
                                                        </td>
                                                        <td class="px-3 py-1.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected()}
                                                                onChange={() =>
                                                                    toggleRowSelection(idx())
                                                                }
                                                                class="w-3.5 h-3.5 rounded cursor-pointer"
                                                            />
                                                        </td>
                                                        <td class="px-3 py-1.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={active()}
                                                                disabled={entry.profileId <= 0}
                                                                onChange={() => toggleActive(idx())}
                                                                class="w-3.5 h-3.5 rounded cursor-pointer disabled:opacity-30"
                                                            />
                                                        </td>
                                                        <td class="px-3 py-1.5 min-w-[110px]">
                                                            <input
                                                                class={inputCls}
                                                                value={editPid()}
                                                                onInput={(e) =>
                                                                    setEditPid(
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                                onBlur={commitPid}
                                                                onKeyDown={onEnter(commitPid)}
                                                            />
                                                        </td>
                                                        <td class="px-3 py-1.5 font-mono text-xs whitespace-nowrap">
                                                            <span
                                                                class={
                                                                    dup()
                                                                        ? "text-yellow-600 dark:text-yellow-400"
                                                                        : "text-gray-500 dark:text-gray-400"
                                                                }
                                                            >
                                                                {fc()}
                                                                <Show when={dup()}>
                                                                    <TriangleAlert
                                                                        size={11}
                                                                        class="inline ml-1 text-yellow-500"
                                                                    />
                                                                </Show>
                                                            </span>
                                                        </td>
                                                        <td class="px-3 py-1.5 text-xs max-w-[130px] truncate">
                                                            <Show when={playerData.loading}>
                                                                <span class="text-gray-400 italic">
                                                                    …
                                                                </span>
                                                            </Show>
                                                            <Show when={!playerData.loading}>
                                                                <span
                                                                    class={
                                                                        takenFCs().has(fc())
                                                                            ? "text-yellow-600 dark:text-yellow-400"
                                                                            : "text-gray-700 dark:text-gray-300"
                                                                    }
                                                                >
                                                                    {playerData()?.name ??
                                                                        (entry.profileId > 0
                                                                            ? "Not found"
                                                                            : "")}
                                                                    <Show
                                                                        when={takenFCs().has(fc())}
                                                                    >
                                                                        <TriangleAlert
                                                                            size={11}
                                                                            class="inline ml-1 text-yellow-500"
                                                                        />
                                                                    </Show>
                                                                </span>
                                                            </Show>
                                                        </td>
                                                        <td class="px-3 py-1.5 min-w-[130px]">
                                                            <div class="flex gap-1 items-center">
                                                                <input
                                                                    class={inputCls}
                                                                    value={editVr()}
                                                                    onInput={(e) =>
                                                                        setEditVr(
                                                                            e.currentTarget.value,
                                                                        )
                                                                    }
                                                                    onBlur={commitVr}
                                                                    onKeyDown={onEnter(commitVr)}
                                                                />
                                                                <Show when={entry.profileId > 0}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={fetchVr}
                                                                        disabled={fetchingVr()}
                                                                        title="Fetch from leaderboard"
                                                                        class="shrink-0 px-1.5 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 transition-colors"
                                                                    >
                                                                        {fetchingVr() ? "…" : "↓"}
                                                                    </button>
                                                                </Show>
                                                            </div>
                                                        </td>
                                                        <td class="px-3 py-1.5 min-w-[100px]">
                                                            <input
                                                                class={inputCls}
                                                                value={editBr()}
                                                                onInput={(e) =>
                                                                    setEditBr(e.currentTarget.value)
                                                                }
                                                                onBlur={commitBr}
                                                                onKeyDown={onEnter(commitBr)}
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
        </div>
    );
}
