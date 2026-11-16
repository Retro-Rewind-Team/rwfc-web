import { Meta, Title } from "@solidjs/meta";
import { ButtonLink } from "../../components/common";
import { NOT_FOUND_META } from "../../constants/pageMeta";

export default function NotFoundPage() {
    return (
        <>
            <Title>{NOT_FOUND_META.title}</Title>
            <Meta name="description" content={NOT_FOUND_META.description} />
            <Meta name="robots" content="noindex" />
            <section class="max-w-2xl py-16 sm:py-24">
                <p class="text-sm font-medium text-fg-subtle tabular-nums">Error 404</p>
                <h1 class="type-display mt-3 text-fg">Page not found</h1>
                <p class="mt-5 text-lg text-fg-muted">
                    There is no page at this address. Check the link, or start again from the home
                    page.
                </p>
                <p class="mt-3 text-base text-fg-muted">
                    Looking for a player? Player pages use their friend code in the format
                    XXXX-XXXX-XXXX.
                </p>
                <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/" variant="primary">
                        Go to the home page
                    </ButtonLink>
                    <ButtonLink href="/vr" variant="secondary">
                        Search the VR leaderboard
                    </ButtonLink>
                </div>
            </section>
        </>
    );
}
