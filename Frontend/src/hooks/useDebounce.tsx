import { createEffect, createSignal } from "solid-js";

export function useDebounce<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = createSignal(value);

    createEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(() => value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    });

    return debouncedValue;
}
