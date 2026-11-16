/**
 * Marks copy that is plausible but not yet confirmed by the maintainers. It is deliberately
 * visible so unverified claims cannot ship unnoticed. Search for `verify` to find every one,
 * confirm or correct the copy, then remove the flag.
 */
export default function VerifyMark() {
    // A text space rather than a left margin, so the mark has no stray indent when it wraps.
    return (
        <>
            {" "}
            <span class="text-xs font-medium whitespace-nowrap text-warn-fg">
                [verify with maintainers]
            </span>
        </>
    );
}
