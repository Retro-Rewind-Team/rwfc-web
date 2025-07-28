import { Router, Route } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { ThemeProvider } from "./stores/theme";
import Layout from "./components/layout/Layout";
import {
  HomePage,
  LeaderboardPage,
  PlayerDetailPage,
  TTLeaderboardPage,
  RoomBrowserPage,
  DownloadsPage,
  TutorialsPage,
  ContactPage,
} from "./pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
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
          <Route path="/tutorials" component={TutorialsPage} />
          <Route path="/contact" component={ContactPage} />
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
