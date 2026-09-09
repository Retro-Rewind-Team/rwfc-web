import { createSignal, onCleanup } from "solid-js";

/**
 * Provides clipboard write with a timed floating confirmation shown at the
 * mouse click position.
 */
export function useClipboard() {
    const [copiedText, setCopiedText] = createSignal<string>("");
    const [copiedPosition, setCopiedPosition] = createSignal<{
        x: number;
        y: number;
    }>({
        x: 0,
        y: 0,
    });
    const [isVisible, setIsVisible] = createSignal(false);

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    const copyToClipboard = async (text: string, label: string, event: MouseEvent) => {
        // Awaited so a rejected write (permission denied, insecure context) surfaces instead of
        // becoming an unhandled rejection while the UI claims the copy succeeded.
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.warn("Clipboard write failed:", error);
            return;
        }

        setCopiedText(label);
        setCopiedPosition({ x: event.clientX, y: event.clientY });
        setIsVisible(true);

        // Replace any in-flight timers so a second copy does not clear the new confirmation early.
        clearTimeout(hideTimer);
        clearTimeout(clearTimer);
        hideTimer = setTimeout(() => setIsVisible(false), 2000);
        clearTimer = setTimeout(() => setCopiedText(""), 2500);
    };

    onCleanup(() => {
        clearTimeout(hideTimer);
        clearTimeout(clearTimer);
    });

    return {
        copiedText,
        copiedPosition,
        isVisible,
        copyToClipboard,
    };
}
