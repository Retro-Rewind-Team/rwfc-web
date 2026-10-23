import { RouteSectionProps, useLocation } from "@solidjs/router";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout(props: RouteSectionProps) {
    const location = useLocation();
    return (
        <>
            {location.pathname === "/" ? (
                <div class="min-h-screen">{props.children}</div>
            ) : (
                <div class="min-h-screen bg-stone-50 dark:bg-gray-900 transition-colors">
                    <Navbar />
                    <main id="main-content" class="container mx-auto px-4 py-8">
                        {props.children}
                    </main>
                    <Footer />
                </div>
            )}
        </>
    );
}
