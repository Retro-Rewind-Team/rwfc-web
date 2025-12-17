import { createSignal } from "solid-js";

export function useClipboard() {
    const [copiedText, setCopiedText] = createSignal<string>("");
    const [copiedPosition, setCopiedPosition] = createSignal<{ x: number; y: number }>({ 
        x: 0, 
        y: 0 
    });
    const [isVisible, setIsVisible] = createSignal(false);

    const copyToClipboard = (text: string, label: string, event: MouseEvent) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setCopiedPosition({ x: event.clientX, y: event.clientY });
        setIsVisible(true);

        setTimeout(() => setIsVisible(false), 2000);
        setTimeout(() => setCopiedText(""), 2500);
    };

    return {
        copiedText,
        copiedPosition,
        isVisible,
        copyToClipboard,
    };
}