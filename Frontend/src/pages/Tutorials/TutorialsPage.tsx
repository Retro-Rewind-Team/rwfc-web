export default function TutorialsPage() {
  return (
    <div class="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Tutorials & Guides
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Everything you need to know to get started with Retro Rewind v6.2.3
        </p>
      </div>

      {/* Quick Start */}
      <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <div class="text-center">
          <div class="text-5xl mb-4">🚀</div>
          <h2 class="text-3xl font-bold mb-4">New to Retro Rewind?</h2>
          <p class="text-xl text-green-100 mb-6">
            Start here for a complete setup guide
          </p>
          <a
            href="https://youtu.be/qH4ou21r8ic?si=m7OMOFRn95-ZtVzo"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-white text-green-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Complete Setup Guide
          </a>
        </div>
      </div>

      {/* Important Notes */}
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div class="flex items-start space-x-3">
          <div class="text-2xl">⚠️</div>
          <div>
            <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Important Notes for v6.2.3
            </h3>
            <div class="text-yellow-800 dark:text-yellow-200 space-y-2">
              <p>
                <strong>Do NOT use Wiimmfi-patched games</strong> - Retro Rewind
                uses Retro WFC servers
              </p>
              <p>
                <strong>Disable all cheat codes</strong> - Any active cheats
                will prevent online play
              </p>
              <p>
                <strong>Console users:</strong> Extract to SD card root, use
                Riivolution with "Pack" and "Separate Savegame" enabled
              </p>
              <p>
                <strong>Dolphin users:</strong> Use Wheel Wizard for easiest
                setup, disable "Enable Cheats"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Tutorials */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Video Tutorials
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4">
              <div class="text-6xl">▶️</div>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Installation Guide For PC
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Step-by-step video guide for installing Retro Rewind on Dolphin
            </p>
            <a
              href="https://www.youtube.com/watch?v=BfuSe-_GpKk"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Watch Tutorial
            </a>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-4">
              <div class="text-6xl">▶️</div>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              New Features Showcase
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Learn about Knockout Mode, brake drifting, ultra mini-turbos, and
              other unique Retro Rewind features
            </p>
            <a
              href="https://www.youtube.com/@ZacharyPL"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Watch Video's
            </a>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div class="flex items-start space-x-3">
          <div class="text-2xl">💡</div>
          <div>
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Still Need Help?
            </h3>
            <p class="text-blue-800 dark:text-blue-200 mb-4">
              The Retro Rewind community is very active and helpful! Join our
              Discord server for real-time support, or check the comprehensive
              wiki for detailed documentation.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <a
                href="https://discord.gg/gXYxgayGWx"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors inline-flex items-center"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Join Discord
              </a>
              <a
                href="https://wiki.tockdom.com/wiki/Retro_Rewind"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded border border-blue-300 dark:border-blue-600 transition-colors"
              >
                View Wiki
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
