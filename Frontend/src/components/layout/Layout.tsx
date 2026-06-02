import { RouteSectionProps } from "@solidjs/router";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout(props: RouteSectionProps) {
    return (
        <div class="min-h-screen bg-stone-50 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main id="main-content" class="container mx-auto px-4 py-8">{props.children}</main>
            <Footer />
        </div>
    );
}
