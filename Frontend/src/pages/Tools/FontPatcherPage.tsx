import { createSignal, type JSX, Show } from "solid-js";
import { CheckCircle, Loader, Package, PenTool, Wrench, XCircle } from "lucide-solid";
import { yaz0Compress, yaz0CompressLiteralOnly, yaz0Decompress } from "../../utils/yaz0";
import { extractFileFromU8, replaceBrfntInU8 } from "../../utils/u8Parser";
import { brfntHasGlyph } from "../../utils/brfntParser";
import {
    getFileExtension,
    validateBrfnt,
    validateFileName,
    validateFontSzs,
} from "../../utils/fileValidator";
import { triggerBlobDownload } from "../../utils/downloadHelpers";
import { AlertBox } from "../../components/common";
import { Meta, Title } from "@solidjs/meta";
import { FONT_PATCHER_META } from "../../constants/pageMeta";

const EXTENSION_FONT = "tt_kart_extension_font.brfnt";

/** Retro Rewind's rank badges, U+F07D..U+F085 (Ranking.cpp). A font without them shows no rank. */
const RANK_GLYPHS = Array.from({ length: 9 }, (_, i) => 0xf07d + i);

const logClass = (line: string) => {
    if (line.startsWith("[OK]") || line.startsWith("[DONE]")) return "text-green-400";
    if (line.startsWith("[ERROR]")) return "text-red-400";
    if (line.startsWith("[WARN]")) return "text-yellow-400";
    return "text-gray-400";
};

interface FileSlot {
    file: File | null;
    warnings: string[];
    error: string | null;
}

/** The Retro Rewind side also holds the extension font it resolved from the dropped file. */
interface SourceSlot extends FileSlot {
    brfnt: Uint8Array | null;
}

const emptySlot = (): FileSlot => ({ file: null, warnings: [], error: null });
const emptySource = (): SourceSlot => ({ ...emptySlot(), brfnt: null });

export default function FontPatcherPage() {
    const [fontSlot, setFontSlot] = createSignal<FileSlot>(emptySlot());
    const [sourceSlot, setSourceSlot] = createSignal<SourceSlot>(emptySource());
    const [processing, setProcessing] = createSignal(false);
    const [log, setLog] = createSignal<string[]>([]);
    const [useLiteralOnly, setUseLiteralOnly] = createSignal(false);
    const [dragging, setDragging] = createSignal<"font" | "source" | null>(null);

    const addLog = (msg: string) => setLog((p) => [...p, msg]);
    const clearLog = () => setLog([]);

    async function loadFont(file: File, successMsg: string) {
        clearLog();
        const nameCheck = validateFileName(file.name, ["szs"]);
        if (!nameCheck.valid) {
            setFontSlot({ file: null, error: nameCheck.error ?? "Invalid file", warnings: [] });
            addLog(`[ERROR] ${nameCheck.error}`);
            return;
        }
        addLog(`[INFO] Validating ${file.name}…`);
        try {
            const result = validateFontSzs(await file.arrayBuffer());
            if (!result.valid) {
                setFontSlot({
                    file: null,
                    error: result.error ?? "Validation failed",
                    warnings: [],
                });
                addLog(`[ERROR] ${result.error}`);
                return;
            }
            const warnings = result.warnings ?? [];
            warnings.forEach((w) => addLog(`[WARN] ${w}`));
            setFontSlot({ file, error: null, warnings });
            addLog(`[OK] ${successMsg}: ${file.name} (${file.size.toLocaleString()} bytes)`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setFontSlot({ file: null, error: msg, warnings: [] });
            addLog(`[ERROR] ${msg}`);
        }
    }

    /**
     * Resolves Retro Rewind's extension font from a whole Font.szs or from the .brfnt itself, then
     * checks it carries the rank badges, since those are the reason for copying it over.
     */
    async function loadSource(file: File, successMsg: string) {
        clearLog();
        const nameCheck = validateFileName(file.name, ["szs", "brfnt"]);
        if (!nameCheck.valid) {
            setSourceSlot({ ...emptySource(), error: nameCheck.error ?? "Invalid file" });
            addLog(`[ERROR] ${nameCheck.error}`);
            return;
        }
        addLog(`[INFO] Validating ${file.name}…`);
        try {
            const buffer = await file.arrayBuffer();
            const warnings: string[] = [];
            let brfnt: Uint8Array;

            if (getFileExtension(file.name) === "szs") {
                const archiveCheck = validateFontSzs(buffer);
                if (!archiveCheck.valid) throw new Error(archiveCheck.error ?? "Invalid Font.szs");
                warnings.push(...(archiveCheck.warnings ?? []));

                const extracted = extractFileFromU8(
                    yaz0Decompress(new Uint8Array(buffer)),
                    EXTENSION_FONT,
                );
                if (!extracted) throw new Error(`${file.name} does not contain ${EXTENSION_FONT}.`);
                brfnt = extracted;
                addLog(
                    `[OK] Found ${EXTENSION_FONT} inside (${brfnt.length.toLocaleString()} bytes)`,
                );
            } else {
                brfnt = new Uint8Array(buffer);
            }

            const fontCheck = validateBrfnt(brfnt.buffer as ArrayBuffer);
            if (!fontCheck.valid) throw new Error(fontCheck.error ?? "Invalid .brfnt");
            warnings.push(...(fontCheck.warnings ?? []));

            if (!RANK_GLYPHS.every((code) => brfntHasGlyph(brfnt, code))) {
                warnings.push(
                    "This font is missing Retro Rewind's rank badges. Use the Font.szs from an up-to-date Retro Rewind install.",
                );
            }

            warnings.forEach((w) => addLog(`[WARN] ${w}`));
            setSourceSlot({ file, brfnt, warnings, error: null });
            addLog(`[OK] ${successMsg}: ${file.name}`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setSourceSlot({ ...emptySource(), error: msg });
            addLog(`[ERROR] ${msg}`);
        }
    }

    const handleFontInput = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) loadFont(file, "Loaded your Font.szs");
    };
    const handleSourceInput = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) loadSource(file, "Loaded Retro Rewind's font");
    };
    const handleDrop = (e: DragEvent, type: "font" | "source") => {
        e.preventDefault();
        setDragging(null);
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (type === "font") loadFont(file, "Dropped your Font.szs");
        else loadSource(file, "Dropped Retro Rewind's font");
    };

    const patch = async () => {
        const font = fontSlot().file;
        const brfnt = sourceSlot().brfnt;
        if (!font || !brfnt) return;

        setProcessing(true);
        clearLog();
        try {
            addLog("[INFO] Reading Font.szs…");
            const fontData = new Uint8Array(await font.arrayBuffer());

            addLog("[INFO] Decompressing Yaz0…");
            const u8 = yaz0Decompress(fontData);
            addLog(`[OK] Decompressed - ${u8.length.toLocaleString()} bytes`);

            addLog(`[INFO] Copying in Retro Rewind's ${EXTENSION_FONT}…`);
            const newU8 = replaceBrfntInU8(u8, brfnt, EXTENSION_FONT);
            addLog(`[OK] Patched - ${newU8.length.toLocaleString()} bytes`);

            addLog(
                useLiteralOnly()
                    ? "[INFO] Re-compressing (literal-only)…"
                    : "[INFO] Re-compressing (optimised)…",
            );
            const newSZS = useLiteralOnly() ? yaz0CompressLiteralOnly(newU8) : yaz0Compress(newU8);
            addLog(`[OK] Compressed - ${newSZS.length.toLocaleString()} bytes`);

            const outName = font.name.replace(/\.szs$/i, "") + "_tt_ext_patched.szs";
            triggerBlobDownload(
                new Blob([newSZS.buffer as ArrayBuffer], { type: "application/octet-stream" }),
                outName,
            );
            addLog(`[DONE] Downloaded: ${outName}`);
        } catch (e) {
            addLog(`[ERROR] ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setProcessing(false);
        }
    };

    const DropZone = (props: {
        label: string;
        hint: string;
        slot: FileSlot;
        type: "font" | "source";
        icon: () => JSX.Element;
        accept: string;
        onInput: (e: Event) => void;
    }) => {
        const active = () => dragging() === props.type;
        const ok = () => !!props.slot.file;
        const err = () => !!props.slot.error;

        return (
            <div
                class={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all
                    ${active() ? "border-blue-500 bg-blue-500/5" : ok() ? "border-green-500/60 bg-green-500/5" : err() ? "border-red-500/60 bg-red-500/5" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(props.type);
                }}
                onDragLeave={() => setDragging(null)}
                onDrop={(e) => handleDrop(e, props.type)}
            >
                <div
                    class={`flex justify-center mb-3 ${ok() ? "text-green-500" : err() ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}
                >
                    <Show
                        when={ok()}
                        fallback={
                            <Show when={err()} fallback={props.icon()}>
                                <XCircle size={36} />
                            </Show>
                        }
                    >
                        <CheckCircle size={36} />
                    </Show>
                </div>

                <p class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {props.label}
                </p>

                <Show when={ok()}>
                    <p class="text-xs text-green-600 dark:text-green-400 font-mono truncate mb-2">
                        {props.slot.file!.name}
                    </p>
                </Show>
                <Show when={err()}>
                    <p class="text-xs text-red-500 mb-2">{props.slot.error}</p>
                </Show>
                <Show when={!ok() && !err()}>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{props.hint}</p>
                </Show>

                <label class="cursor-pointer inline-block">
                    <span
                        class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                        ${
                            ok()
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        {ok() ? "Replace file" : "Choose file"}
                    </span>
                    <input
                        type="file"
                        accept={props.accept}
                        onChange={props.onInput}
                        class="hidden"
                    />
                </label>

                <Show when={props.slot.warnings.length > 0}>
                    <p class="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        {props.slot.warnings.length} warning
                        {props.slot.warnings.length > 1 ? "s" : ""}
                    </p>
                </Show>
            </div>
        );
    };

    const canPatch = () => !!fontSlot().file && !!sourceSlot().brfnt && !processing();

    return (
        <div class="max-w-3xl mx-auto space-y-6">
            <Title>{FONT_PATCHER_META.title}</Title>
            <Meta name="description" content={FONT_PATCHER_META.description} />
            <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Font Patcher</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Use a custom font without losing Retro Rewind's rank badges. The patcher copies
                    Retro Rewind's{" "}
                    <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {EXTENSION_FONT}
                    </code>{" "}
                    into your{" "}
                    <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        Font.szs
                    </code>
                    .
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DropZone
                    label="1. Your Font.szs"
                    hint="The custom font you want to use"
                    slot={fontSlot()}
                    type="font"
                    icon={() => <Package size={36} />}
                    accept=".szs"
                    onInput={handleFontInput}
                />
                <DropZone
                    label="2. Retro Rewind's Font.szs"
                    hint="RetroRewind6/UI/Font.szs, or its .brfnt on its own"
                    slot={sourceSlot()}
                    type="source"
                    icon={() => <PenTool size={36} />}
                    accept=".szs,.brfnt"
                    onInput={handleSourceInput}
                />
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <label class="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useLiteralOnly()}
                        onChange={(e) => setUseLiteralOnly(e.currentTarget.checked)}
                        class="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Literal-only Yaz0 (no compression)
                        </span>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Produces a larger file. Only needed if the compressed output causes
                            issues on real hardware.
                        </p>
                    </div>
                </label>
            </div>

            <div class="flex justify-center">
                <button
                    type="button"
                    onClick={patch}
                    disabled={!canPatch()}
                    class="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-gray-500 font-semibold rounded-xl transition-colors text-sm"
                >
                    <Show
                        when={processing()}
                        fallback={
                            <>
                                <Wrench size={16} /> Patch Font.szs
                            </>
                        }
                    >
                        <Loader size={16} class="animate-spin" /> Processing…
                    </Show>
                </button>
            </div>

            <Show when={log().length > 0}>
                <div class="bg-gray-950 rounded-xl border border-gray-800 p-4">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Log
                    </p>
                    <div class="space-y-0.5 font-mono text-xs">
                        {log().map((line) => (
                            <div class={logClass(line)}>{line}</div>
                        ))}
                    </div>
                </div>
            </Show>

            <AlertBox type="info" title="Notes">
                <ul class="space-y-1 text-sm list-disc list-inside">
                    <li>
                        Retro Rewind's font is at{" "}
                        <code class="font-mono">RetroRewind6/UI/Font.szs</code> in your install.
                        Take it from an up-to-date copy: older fonts don't have the rank badges.
                    </li>
                    <li>
                        Back up your original <code class="font-mono">Font.szs</code> before
                        replacing it.
                    </li>
                    <li>If the patched file doesn't load in-game, try the literal-only option.</li>
                </ul>
            </AlertBox>
        </div>
    );
}
