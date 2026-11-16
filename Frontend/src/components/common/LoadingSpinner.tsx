export default function LoadingSpinner() {
    return (
        <div
            role="status"
            class="h-8 w-8 animate-spin rounded-full border border-line border-t-accent"
        >
            <span class="sr-only">Loading</span>
        </div>
    );
}
