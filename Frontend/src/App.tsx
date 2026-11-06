import { Route, Router } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { ThemeProvider } from "./stores/theme";
import { ApiError } from "./services/api/client";
import { lazy } from "solid-js";
import Layout from "./components/layout/Layout";
import { HomePage } from "./pages/Home";

/*
 * Home ships in the main bundle because it is where most visits start. Every other page is its
 * own chunk, so the landing page no longer downloads the save-file parsers, font patcher and
 * charts. The router fetches a page's chunk as soon as a link to it is hovered or focused, so on
 * a click it is usually already there.
 */
const LeaderboardPage = lazy(() => import("./pages/Leaderboard/LeaderboardPage"));
const LeaderboardPlayerDetailPage = lazy(
    () => import("./pages/Leaderboard/LeaderboardPlayerDetailPage"),
);
const TTLeaderboardPage = lazy(() => import("./pages/TTLeaderboard/TTLeaderboardPage"));
const TTRankingsPage = lazy(() => import("./pages/TTLeaderboard/TTRankingsPage"));
const TTTrackDetailPage = lazy(() => import("./pages/TTLeaderboard/TTTrackDetailPage"));
const TTPlayerProfilePage = lazy(() => import("./pages/TTLeaderboard/TTPlayerProfilePage"));
const RoomStatusPage = lazy(() => import("./pages/RoomStatus/RoomStatusPage"));
const DownloadsPage = lazy(() => import("./pages/Downloads/DownloadsPage"));
const RulesPage = lazy(() => import("./pages/Rules/RulesPage"));
const PrivacyPage = lazy(() => import("./pages/Privacy/PrivacyPage"));
const TeamPage = lazy(() => import("./pages/Team/TeamPage"));
const RaceStatsPage = lazy(() => import("./pages/RaceStats/RaceStatsPage"));
const RacesPage = lazy(() => import("./pages/Races/RacesPage"));
const ToolsPage = lazy(() => import("./pages/Tools/ToolsPage"));
const FontPatcherPage = lazy(() => import("./pages/Tools/FontPatcherPage"));
const RatingEditorPage = lazy(() => import("./pages/Tools/RatingEditorPage"));
const VRCalculatorPage = lazy(() => import("./pages/Tools/VRCalculatorPage"));
const RankHelperPage = lazy(() => import("./pages/Tools/RankHelperPage"));
const NotFoundPage = lazy(() => import("./pages/NotFound/NotFoundPage"));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 10,
            retry: (failureCount, error) => {
                // Don't retry a 404. Read the status rather than matching message text: a message
                // that merely mentions 404 would match, and one that does not gets retried three
                // times against an endpoint that will never answer.
                if (error instanceof ApiError && error.status === 404) {
                    return false;
                }
                // Otherwise retry up to 2 times
                return failureCount < 2;
            },
        },
    },
});

function App() {
    return (
        <MetaProvider>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <Router root={Layout}>
                        {/* Home Page */}
                        <Route path="/" component={HomePage} />

                        {/* VR Leaderboard Routes */}
                        <Route path="/vr" component={LeaderboardPage} />
                        <Route path="/leaderboard" component={LeaderboardPage} />
                        <Route
                            path="/vr/player/:friendCode"
                            component={LeaderboardPlayerDetailPage}
                        />
                        <Route path="/player/:friendCode" component={LeaderboardPlayerDetailPage} />

                        {/* Time Trial Routes */}
                        <Route path="/tt-leaderboard" component={TTLeaderboardPage} />
                        <Route path="/tt" component={TTLeaderboardPage} />
                        <Route path="/timetrial" component={TTLeaderboardPage} />

                        {/* TT Player Rankings */}
                        <Route path="/timetrial/rankings" component={TTRankingsPage} />
                        <Route path="/tt/rankings" component={TTRankingsPage} />

                        {/* Individual Track Pages */}
                        <Route path="/timetrial/:cc/:trackId" component={TTTrackDetailPage} />
                        <Route path="/tt/:cc/:trackId" component={TTTrackDetailPage} />

                        {/* TT Player Profile */}
                        <Route path="/tt/player/:ttProfileId" component={TTPlayerProfilePage} />
                        <Route
                            path="/timetrial/player/:ttProfileId"
                            component={TTPlayerProfilePage}
                        />

                        {/* Room Browser Routes */}
                        <Route path="/room-browser" component={RoomStatusPage} />
                        <Route path="/rooms" component={RoomStatusPage} />

                        {/* Community Pages */}
                        <Route path="/downloads" component={DownloadsPage} />
                        <Route path="/rules" component={RulesPage} />
                        <Route path="/privacy" component={PrivacyPage} />
                        <Route path="/team" component={TeamPage} />
                        <Route path="/stats" component={RaceStatsPage} />
                        <Route path="/races" component={RacesPage} />
                        {/* Tools Pages */}
                        <Route path="/tools" component={ToolsPage} />
                        <Route path="tools/font-patcher" component={FontPatcherPage} />
                        <Route path="tools/rating-editor" component={RatingEditorPage} />
                        <Route path="tools/vr-calculator" component={VRCalculatorPage} />
                        <Route path="tools/rank-helper" component={RankHelperPage} />

                        {/* 404 Catch-All */}
                        <Route path="*" component={NotFoundPage} />
                    </Router>
                </QueryClientProvider>
            </ThemeProvider>
        </MetaProvider>
    );
}

export default App;
