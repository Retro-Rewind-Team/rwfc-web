import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout(props: any) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main class="container mx-auto px-4 py-8">{props.children}</main>
      <Footer />
    </div>
  );
}
