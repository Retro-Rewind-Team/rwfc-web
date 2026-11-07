import { createSignal, Show } from "solid-js";
import { RefreshCw } from "lucide-solid";
import AlertBox from "./AlertBox";
import Button from "./Button";

interface QueryErrorProps {
    /** What failed, e.g. "Couldn't load the leaderboard". */
    title: string;
    error?: Error | null;
    /** Runs the query again. Pass the query's `refetch`. */
    onRetry: () => unknown;
}

/**
 * A failed request with a Retry button. Every data view uses this, so a failure is never a dead
 * end. The button disables while the retry runs so a slow server is not hit with a click storm.
 */
export default function QueryError(props: QueryErrorProps) {
    const [retrying, setRetrying] = createSignal(false);

    const retry = async () => {
        setRetrying(true);
        try {
            await props.onRetry();
        } finally {
            setRetrying(false);
        }
    };

    return (
        <AlertBox type="error" title={props.title}>
            <Show when={props.error?.message}>
                <p class="mb-3">{props.error!.message}</p>
            </Show>
            <Button size="sm" onClick={retry} disabled={retrying()}>
                <RefreshCw size={14} aria-hidden="true" />
                {retrying() ? "Retrying…" : "Retry"}
            </Button>
        </AlertBox>
    );
}
