import { createSignal, onCleanup } from "solid-js";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar(props: SearchBarProps) {
    const [query, setQuery] = createSignal("");
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleInput = (value: string) => {
        setQuery(value);

        // Debounce search
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            props.onSearch(value);
        }, 300);
    };

    onCleanup(() => {
        clearTimeout(timeoutId);
    });

    return (
        <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
            <input
                type="text"
                placeholder={props.placeholder || "Search..."}
                value={query()}
                onInput={(e) => handleInput(e.target.value)}
                class="input-field pl-10"
            />
        </div>
    );
}
