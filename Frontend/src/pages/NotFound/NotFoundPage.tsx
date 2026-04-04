import { A } from "@solidjs/router";
import { Home } from "lucide-solid";
import { AlertBox } from "../../components/common";

export default function NotFoundPage() {
    return (
        <div class="max-w-4xl mx-auto">
            <div class="min-h-[60vh] flex items-center justify-center">
                <div class="text-center space-y-6">
                    <div class="text-9xl font-bold text-gray-200 dark:text-gray-700">404</div>

                    <div class="space-y-3">
                        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Off the Track!
                        </h1>
                        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            Looks like you took a wrong turn. This page doesn't exist.
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <A
                            href="/"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <Home size={18} />
                            Back to Home
                        </A>
                    </div>

                    <div class="pt-8">
                        <div class="inline-block">
                            <AlertBox type="info">
                                <p class="text-sm">
                                    <strong>Looking for a player?</strong> Make sure you're using
                                    their correct friend code in the format: XXXX-XXXX-XXXX
                                </p>
                            </AlertBox>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
