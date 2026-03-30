import { createSignal, Show } from "solid-js";
import { Loader, Package, PenTool, Wrench } from "lucide-solid";
import {
    yaz0Compress,
    yaz0CompressLiteralOnly,
    yaz0Decompress,
} from "../../utils/yaz0";
import { replaceBrfntInU8 } from "../../utils/u8Parser";
import {
    validateBrfnt,
    validateFileName,
    validateFontSzs,
} from "../../utils/fileValidator";
import { AlertBox } from "../../components/common";

const getLogClass = (line: string) => {
    if (line.startsWith("[OK]") || line.startsWith("[DONE]"))
        return "text-green-400";
    if (line.startsWith("[ERROR]")) return "text-red-400";
    if (line.startsWith("[WARN]")) return "text-yellow-400";
    if (line.startsWith("[INFO]") || line.startsWith("[SAVE]"))
        return "text-blue-400";
    return "text-gray-400";
};

export default function FontPatcherPage() {
    const [fontFile, setFontFile] = createSignal<File | null>(null);
    const [brfntFile, setBrfntFile] = createSignal<File | null>(null);
    const [processing, setProcessing] = createSignal(false);
    const [log, setLog] = createSignal<string[]>([]);
    const [useLiteralOnly, setUseLiteralOnly] = createSignal(false);
    const [validationWarnings, setValidationWarnings] = createSignal<string[]>(
        [],
    );

    const addLog = (message: string) => setLog((prev) => [...prev, message]);
    const clearLog = () => setLog([]);

    const handleFontFileUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        clearLog();
        setValidationWarnings([]);
        setFontFile(null);

        const nameValidation = validateFileName(file.name, ["szs"]);
        if (!nameValidation.valid) {
            addLog(`[ERROR] ${nameValidation.error}`);
            return;
        }

        addLog(`[INFO] Validating ${file.name}...`);

        try {
            const buffer = await file.arrayBuffer();
            const validation = validateFontSzs(buffer);

            if (!validation.valid) {
                addLog(`[ERROR] Validation failed: ${validation.error}`);
                return;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach((w) => addLog(`[WARN] ${w}`));
                setValidationWarnings(validation.warnings);
            }

            setFontFile(file);
            addLog(
                `[OK] Loaded Font.szs: ${file.name} (${file.size.toLocaleString()} bytes)`,
            );
        } catch (error) {
            addLog(
                `[ERROR] Error reading file: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };

    const handleBrfntFileUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        clearLog();
        setValidationWarnings([]);
        setBrfntFile(null);

        const nameValidation = validateFileName(file.name, ["brfnt"]);
        if (!nameValidation.valid) {
            addLog(`[ERROR] ${nameValidation.error}`);
            return;
        }

        addLog(`[INFO] Validating ${file.name}...`);

        try {
            const buffer = await file.arrayBuffer();
            const validation = validateBrfnt(buffer);

            if (!validation.valid) {
                addLog(`[ERROR] Validation failed: ${validation.error}`);
                return;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach((w) => addLog(`[WARN] ${w}`));
                setValidationWarnings(validation.warnings);
            }

            setBrfntFile(file);
            addLog(
                `[OK] Loaded replacement .brfnt: ${file.name} (${file.size.toLocaleString()} bytes)`,
            );
        } catch (error) {
            addLog(
                `[ERROR] Error reading file: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };

    const handleDrop = async (event: DragEvent, type: "font" | "brfnt") => {
        event.preventDefault();
        event.stopPropagation();

        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        clearLog();
        setValidationWarnings([]);

        if (type === "font") {
            const nameValidation = validateFileName(file.name, ["szs"]);
            if (!nameValidation.valid) {
                addLog(`[ERROR] ${nameValidation.error}`);
                return;
            }

            addLog(`[INFO] Validating ${file.name}...`);

            try {
                const buffer = await file.arrayBuffer();
                const validation = validateFontSzs(buffer);

                if (!validation.valid) {
                    addLog(`[ERROR] Validation failed: ${validation.error}`);
                    return;
                }

                if (validation.warnings && validation.warnings.length > 0) {
                    validation.warnings.forEach((w) => addLog(`[WARN] ${w}`));
                    setValidationWarnings(validation.warnings);
                }

                setFontFile(file);
                addLog(
                    `[OK] Dropped Font.szs: ${file.name} (${file.size.toLocaleString()} bytes)`,
                );
            } catch (error) {
                addLog(
                    `[ERROR] Error reading file: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        } else {
            const nameValidation = validateFileName(file.name, ["brfnt"]);
            if (!nameValidation.valid) {
                addLog(`[ERROR] ${nameValidation.error}`);
                return;
            }

            addLog(`[INFO] Validating ${file.name}...`);

            try {
                const buffer = await file.arrayBuffer();
                const validation = validateBrfnt(buffer);

                if (!validation.valid) {
                    addLog(`[ERROR] Validation failed: ${validation.error}`);
                    return;
                }

                if (validation.warnings && validation.warnings.length > 0) {
                    validation.warnings.forEach((w) => addLog(`[WARN] ${w}`));
                    setValidationWarnings(validation.warnings);
                }

                setBrfntFile(file);
                addLog(
                    `[OK] Dropped replacement .brfnt: ${file.name} (${file.size.toLocaleString()} bytes)`,
                );
            } catch (error) {
                addLog(
                    `[ERROR] Error reading file: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const processFontPatch = async () => {
        const font = fontFile();
        const brfnt = brfntFile();

        if (!font) {
            addLog("[ERROR] Please select a Font.szs file");
            return;
        }
        if (!brfnt) {
            addLog("[ERROR] Please select a replacement .brfnt file");
            return;
        }

        setProcessing(true);
        clearLog();

        try {
            addLog("[INFO] Reading Font.szs...");
            const fontData = new Uint8Array(await font.arrayBuffer());

            addLog("[INFO] Decompressing Yaz0...");
            const u8 = yaz0Decompress(fontData);
            addLog(`[OK] Decompressed to ${u8.length.toLocaleString()} bytes`);

            addLog("[INFO] Reading replacement .brfnt...");
            const replacementData = new Uint8Array(await brfnt.arrayBuffer());
            addLog(`[OK] Loaded ${replacementData.length.toLocaleString()} bytes`);

            addLog(
                "[INFO] Patching U8 archive (replacing tt_kart_extension_font.brfnt)...",
            );
            const newU8 = replaceBrfntInU8(u8, replacementData);
            addLog(
                `[OK] Patched U8 archive (${newU8.length.toLocaleString()} bytes)`,
            );

            let newSZS: Uint8Array;
            if (useLiteralOnly()) {
                addLog("[INFO] Re-compressing as Yaz0 (literal-only)...");
                newSZS = yaz0CompressLiteralOnly(newU8);
            } else {
                addLog("[INFO] Re-compressing as Yaz0 (optimized)...");
                newSZS = yaz0Compress(newU8);
            }
            addLog(`[OK] Compressed to ${newSZS.length.toLocaleString()} bytes`);

            const baseName = font.name.replace(/\.szs$/i, "");
            const outName = `${baseName}_tt_ext_patched.szs`;

            addLog("[SAVE] Triggering download...");
            downloadFile(newSZS, outName);
            addLog(`[DONE] Done! Downloaded: ${outName}`);
        } catch (error) {
            addLog(
                `[ERROR] ${error instanceof Error ? error.message : String(error)}`,
            );
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const downloadFile = (data: Uint8Array, fileName: string) => {
        const blob = new Blob([new Uint8Array(data)], {
            type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div class="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div class="text-center py-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Font Patcher
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
          Replace tt_kart_extension_font.brfnt in Font.szs archives
                </p>
            </div>

            {/* Instructions */}
            <AlertBox type="info" title="How to use">
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li>
            Upload your{" "}
                        <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              Font.szs
                        </code>{" "}
            file
                    </li>
                    <li>
            Upload your custom{" "}
                        <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              tt_kart_extension_font.brfnt
                        </code>{" "}
            file
                    </li>
                    <li>Click "Patch Font" to create a modified Font.szs</li>
                    <li>The patched file will download automatically</li>
                </ol>
            </AlertBox>

            {/* Validation Warnings */}
            <Show when={validationWarnings().length > 0}>
                <AlertBox type="warning" title="Validation Warnings">
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        {validationWarnings().map((w) => (
                            <li>{w}</li>
                        ))}
                    </ul>
                    <p class="mt-3 text-sm">
            The file passed basic validation but has some unusual
            characteristics. You can proceed, but double-check your file if the
            patch doesn't work.
                    </p>
                </AlertBox>
            </Show>

            {/* File Upload Section */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Font.szs */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            1. Font.szs File
                    </h3>
                    <div
                        onDrop={(e) => handleDrop(e, "font")}
                        onDragOver={handleDragOver}
                        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    >
                        <div class="flex justify-center mb-3 text-gray-400 dark:text-gray-500">
                            <Package size={36} />
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Drag & drop Font.szs here
                        </p>
                        <label class="cursor-pointer">
                            <span class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block text-sm font-medium">
                Choose File
                            </span>
                            <input
                                type="file"
                                accept=".szs"
                                onChange={handleFontFileUpload}
                                class="hidden"
                            />
                        </label>
                    </div>
                    <Show when={fontFile()}>
                        <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p class="text-sm text-green-800 dark:text-green-300 font-medium">
                                {fontFile()!.name}
                            </p>
                            <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                                {fontFile()!.size.toLocaleString()} bytes
                            </p>
                        </div>
                    </Show>
                </div>

                {/* .brfnt */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            2. Replacement .brfnt
                    </h3>
                    <div
                        onDrop={(e) => handleDrop(e, "brfnt")}
                        onDragOver={handleDragOver}
                        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    >
                        <div class="flex justify-center mb-3 text-gray-400 dark:text-gray-500">
                            <PenTool size={36} />
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Drag & drop .brfnt here
                        </p>
                        <label class="cursor-pointer">
                            <span class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block text-sm font-medium">
                Choose File
                            </span>
                            <input
                                type="file"
                                accept=".brfnt"
                                onChange={handleBrfntFileUpload}
                                class="hidden"
                            />
                        </label>
                    </div>
                    <Show when={brfntFile()}>
                        <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p class="text-sm text-green-800 dark:text-green-300 font-medium">
                                {brfntFile()!.name}
                            </p>
                            <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                                {brfntFile()!.size.toLocaleString()} bytes
                            </p>
                        </div>
                    </Show>
                </div>
            </div>

            {/* Options */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Options
                </h3>
                <label class="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useLiteralOnly()}
                        onChange={(e) => setUseLiteralOnly(e.currentTarget.checked)}
                        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Use literal-only Yaz0 (no real compression)
                        </span>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Only recommended if compressed output causes issues. File will be
              larger but more compatible.
                        </p>
                    </div>
                </label>
            </div>

            {/* Patch Button */}
            <div class="flex justify-center">
                <button
                    onClick={processFontPatch}
                    disabled={!fontFile() || !brfntFile() || processing()}
                    class="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                    <Show
                        when={processing()}
                        fallback={
                            <>
                                <Wrench size={18} /> Patch Font
                            </>
                        }
                    >
                        <Loader size={18} class="animate-spin" />
            Processing...
                    </Show>
                </button>
            </div>

            {/* Log Output */}
            <Show when={log().length > 0}>
                <div class="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-300 mb-3">Process Log</h3>
                    <div class="space-y-1 font-mono text-sm">
                        {log().map((line) => (
                            <div class={getLogClass(line)}>{line}</div>
                        ))}
                    </div>
                </div>
            </Show>

            {/* Important Notes */}
            <AlertBox type="warning" title="Important Notes">
                <ul class="space-y-1 text-sm">
                    <li>
            Files are validated before processing to ensure correct format
                    </li>
                    <li>
            The patched Font.szs is compatible with Retro Rewind and most MKW
            distributions
                    </li>
                    <li>
            Make sure your .brfnt file is properly formatted for Mario Kart Wii
                    </li>
                    <li>Keep a backup of your original Font.szs before replacing</li>
                    <li>
            If the patched file doesn't work, try enabling "literal-only"
            compression
                    </li>
                </ul>
            </AlertBox>
        </div>
    );
}
