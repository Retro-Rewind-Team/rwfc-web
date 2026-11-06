import { RouteSectionProps } from "@solidjs/router";
import { onCleanup, onMount } from "solid-js";
import { startScrollReveals } from "../../utils/motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

/*
 * One container for every route: the same max width and gutters as the header and footer, so
 * edges line up from top to bottom of every page.
 */
export default function Layout(props: RouteSectionProps) {
    onMount(() => onCleanup(startScrollReveals()));

    return (
        <div class="flex min-h-screen flex-col bg-canvas text-fg">
            <Navbar />
            {/* page-grid keeps content in the header's column; .full-bleed children can span it. */}
            <main
                id="main-content"
                tabindex="-1"
                class="page-grid w-full flex-1 py-10 outline-none"
            >
                {props.children}
            </main>
            <Footer />
            <BackToTop />
        </div>
    );
}
