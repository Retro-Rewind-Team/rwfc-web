import { A } from "@solidjs/router";
import { AlertBox } from "../../components/common";

export default function NotFoundPage() {
    return (
        <div class="max-w-4xl mx-auto">
            <div class="min-h-[60vh] flex items-center justify-center">
                <div class="text-center space-y-6">
                    {/* Large 404 */}
                    <div class="text-9xl font-bold text-gray-200 dark:text-gray-700">
                        404
                    </div>

                    {/* Icon and Message */}
                    <div class="space-y-3">
                        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Off the Track!
                        </h1>
                        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            Looks like you took a wrong turn. This page doesn't exist.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <A
                            href="/"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
                        >
                            <svg
                                class="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                            Back to Home
                        </A>
                    </div>

                    {/* Help Text */}
                    <div class="pt-8">
                        <div class="inline-block">
                            <AlertBox type="info" icon="💡">
                                <p class="text-sm">
                                    <strong>Looking for a player?</strong> Make sure you're
                                    using their correct friend code in the format:
                                    XXXX-XXXX-XXXX
                                </p>
                            </AlertBox>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}