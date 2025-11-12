import { Route, Router } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { ThemeProvider } from "./stores/theme";
import Layout from "./components/layout/Layout";
import {
    DownloadsPage,
    HomePage,
    LeaderboardPage,
    NotFoundPage,
    PlayerDetailPage,
    RoomBrowserPage,
    RulesPage,
    TeamPage,
    TTLeaderboardPage,
} from "./pages";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, 
            gcTime: 1000 * 60 * 10,
            retry: (failureCount, error) => {
                // Don't retry if it's a 404 error
                if (error instanceof Error && error.message.includes("404")) {
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
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <Router root={Layout}>
                    {/* Home Page */}
                    <Route path="/" component={HomePage} />

                    {/* VR Leaderboard Routes */}
                    <Route path="/vr" component={LeaderboardPage} />
                    <Route path="/leaderboard" component={LeaderboardPage} />
                    <Route path="/vr/player/:friendCode" component={PlayerDetailPage} />
                    <Route path="/player/:friendCode" component={PlayerDetailPage} />

                    {/* Future: Time Trial Routes */}
                    <Route path="/tt-leaderboard" component={TTLeaderboardPage} />
                    <Route path="/tt" component={TTLeaderboardPage} />

                    {/* Future: Room Browser Routes */}
                    <Route path="/room-browser" component={RoomBrowserPage} />
                    <Route path="/rooms" component={RoomBrowserPage} />

                    {/* Community Pages */}
                    <Route path="/downloads" component={DownloadsPage} />
                    <Route path="/rules" component={RulesPage} />
                    <Route path="/team" component={TeamPage} />

                    {/* 404 Catch-All - MUST BE LAST */}
                    <Route path="*" component={NotFoundPage} />
                </Router>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;