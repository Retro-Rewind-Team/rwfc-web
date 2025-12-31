import { Show } from "solid-js";
import { GhostSubmission } from "../../types/timeTrial";
import { getCharacterName, getVehicleName } from "../../utils/marioKartMappings";
import { CountryFlag, LoadingSpinner } from "../common";

interface TTWorldRecordCardProps {
  worldRecord: GhostSubmission | null | undefined;
  isLoading: boolean;
  isError: boolean;
  onDownloadGhost: (submission: GhostSubmission) => void;
}

export default function TTWorldRecordCard(props: TTWorldRecordCardProps) {
    return (
        <div class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-lg border-2 border-yellow-300 p-6 shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">🏆</span>
                    <h3 class="text-2xl font-bold text-white drop-shadow-md">
            World Record
                    </h3>
                </div>
            </div>

            <Show when={props.isLoading}>
                <div class="text-center py-4">
                    <LoadingSpinner />
                </div>
            </Show>

            <Show when={props.isError}>
                <div class="text-white text-center py-4">
          Failed to load world record
                </div>
            </Show>

            <Show when={props.worldRecord && !props.isLoading}>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Time & Player */}
                        <div>
                            <div class="text-5xl font-black text-white mb-2 drop-shadow-md">
                                {props.worldRecord!.finishTimeDisplay}
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="text-lg font-semibold text-white/90">
                                        {props.worldRecord!.playerName}
                                    </div>
                                    <CountryFlag
                                        countryAlpha2={props.worldRecord!.countryAlpha2}
                                        countryName={props.worldRecord!.countryName}
                                        size="sm"
                                    />
                                </div>
                                <div class="text-sm text-white/80">
                                    {props.worldRecord!.miiName}
                                </div>
                            </div>
                            <div class="mt-2">
                                <Show when={props.worldRecord!.shroomless}>
                                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white/20 text-white mr-1">
                    🍄 Shroomless
                                    </span>
                                </Show>
                                <Show when={props.worldRecord!.glitch}>
                                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white/20 text-white">
                    ⚡ Glitch
                                    </span>
                                </Show>
                            </div>
                        </div>

                        {/* Setup Details */}
                        <div class="space-y-2">
                            <div>
                                <div class="text-xs text-white/70 uppercase tracking-wide">Character</div>
                                <div class="text-white font-medium">{getCharacterName(props.worldRecord!.characterId)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-white/70 uppercase tracking-wide">Vehicle</div>
                                <div class="text-white font-medium">{getVehicleName(props.worldRecord!.vehicleId)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-white/70 uppercase tracking-wide">Date Set</div>
                                <div class="text-white font-medium">{new Date(props.worldRecord!.dateSet).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Download Button */}
                    <div class="mt-4 pt-4 border-t border-white/20">
                        <button
                            onClick={() => props.onDownloadGhost(props.worldRecord!)}
                            class="w-full bg-white hover:bg-gray-100 text-yellow-600 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
              Download World Record Ghost
                        </button>
                    </div>
                </div>
            </Show>

            <Show when={!props.worldRecord && !props.isLoading && !props.isError}>
                <div class="text-center py-8 text-white">
                    <div class="text-4xl mb-2">🎯</div>
                    <div class="font-semibold">No world record yet!</div>
                    <div class="text-sm text-white/80">Be the first to set a time</div>
                </div>
            </Show>
        </div>
    );
}