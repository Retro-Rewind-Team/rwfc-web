export default function DownloadsPage() {
  return (
    <div class="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
          Downloads
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 transition-colors">
          Get everything you need to start racing on Retro Rewind
        </p>
      </div>

      {/* Main Download */}
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 class="text-3xl font-bold mb-4">Retro Rewind v6.2.3</h2>
        <p class="text-xl text-blue-100 mb-6">
          Complete distribution with 184 retro tracks and 80 custom tracks
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <a
            href="http://update.rwfc.net:8000/RetroRewind/zip/RetroRewind.zip"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Full Download (First Install)
          </a>
          <a
            href="http://update.rwfc.net:8000/RetroRewind/zip/2.3.zip"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-blue-800 text-white hover:bg-blue-900 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Update Only (v6.2.2 → v6.2.3)
          </a>
        </div>
        <p class="text-sm text-blue-200">Latest version: July 22, 2025</p>
      </div>

      {/* Installation Methods */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
          <div class="text-3xl mb-3">🎮</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
            Wii/Wii U Console
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
            Install via Riivolution or use the Retro Rewind Channel (Homebrew
            Application)
          </p>
          <ul class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <li>• Extract to SD card root directory</li>
            <li>• Launch via Riivolution or Channel</li>
            <li>• Auto-updater included</li>
          </ul>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
          <div class="text-3xl mb-3">💻</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
            Dolphin Emulator
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
            Use Wheel Wizard for easy setup or ISO Builder for custom ISOs
          </p>
          <div class="space-y-2">
            <a
              href="https://github.com/TeamWheelWizard/WheelWizard"
              target="_blank"
              rel="noopener noreferrer"
              class="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
            >
              → Download Wheel Wizard (GitHub)
            </a>
            <a
              href="https://mega.nz/folder/yW40yJqI#l9RG4RsVWRSwoAVyXpqr4w"
              target="_blank"
              rel="noopener noreferrer"
              class="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
            >
              → ISO Builder (MEGA)
            </a>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
          System Requirements
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
              Required
            </h3>
            <ul class="space-y-2 text-gray-600 dark:text-gray-300 transition-colors">
              <li class="flex items-center">
                <span class="text-green-500 mr-2">✓</span>
                Mario Kart Wii (original disc or clean ISO)
              </li>
              <li class="flex items-center">
                <span class="text-green-500 mr-2">✓</span>
                Nintendo Wii, Wii U (vWii), or Dolphin
              </li>
              <li class="flex items-center">
                <span class="text-green-500 mr-2">✓</span>
                SD card (2GB+ for console, any size for Dolphin)
              </li>
              <li class="flex items-center">
                <span class="text-green-500 mr-2">✓</span>
                Internet connection for Retro WFC
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
              Important Notes
            </h3>
            <ul class="space-y-2 text-gray-600 dark:text-gray-300 transition-colors">
              <li class="flex items-center">
                <span class="text-yellow-500 mr-2">⚠️</span>
                Do not use Wiimmfi-patched games
              </li>
              <li class="flex items-center">
                <span class="text-yellow-500 mr-2">⚠️</span>
                Disable all cheat codes and mods
              </li>
              <li class="flex items-center">
                <span class="text-blue-500 mr-2">•</span>
                Uses Retro WFC servers (not Wiimmfi)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
          Quick Installation (Console)
        </h2>
        <div class="space-y-4">
          <div class="flex items-start space-x-4">
            <div class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white transition-colors">
                Download Retro Rewind
              </h3>
              <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Download the full version from rwfc.net if installing for the
                first time
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white transition-colors">
                Extract to SD Card
              </h3>
              <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Extract all files to your SD card's root directory (turn off
                write lock)
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white transition-colors">
                Launch Game
              </h3>
              <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Use Riivolution (enable "Pack" and "Separate Savegame") or the
                Retro Rewind Channel
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white transition-colors">
                Connect to Retro WFC
              </h3>
              <p class="text-gray-600 dark:text-gray-300 transition-colors">
                Access online features through the in-game menus - no additional
                setup required
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
          <div class="text-3xl mb-3">📋</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
            Track List
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
            View all 184 retro tracks and 80 custom tracks included in v6.2.3
          </p>
          <a
            href="https://docs.google.com/spreadsheets/d/1FelOidNHL1bqSaKeycZux1eQcDyrosONFC_qWVTYoog/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
          >
            View Track List
            <svg
              class="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
          <div class="text-3xl mb-3">🏆</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
            Time Trial Records
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
            Check out the fastest times and staff ghosts for every track
          </p>
          <a
            href="https://docs.google.com/spreadsheets/d/1XkHTTuUR3_10-C7geVhJ9TtCb4Bz_gE19NysbGnUOZs/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
          >
            View Records
            <svg
              class="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-6 transition-colors">
          <div class="text-3xl mb-3">📖</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
            Full Documentation
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
            Complete wiki with features, troubleshooting, and version history
          </p>
          <a
            href="https://wiki.tockdom.com/wiki/Retro_Rewind"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
          >
            View Wiki
            <svg
              class="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Help Section */}
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
        <div class="flex items-start space-x-3">
          <div class="text-2xl">ℹ️</div>
          <div>
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 transition-colors">
              Need Help?
            </h3>
            <p class="text-blue-800 dark:text-blue-200 mb-3 transition-colors">
              Having trouble with installation or experiencing crashes? Check
              the troubleshooting guide or ask the community for help!
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <a
                href="/tutorials"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                View Tutorials
              </a>
              <a
                href="https://discord.gg/gXYxgayGWx"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-2 px-4 rounded border border-blue-300 dark:border-blue-600 transition-colors"
              >
                Troubleshooting
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
