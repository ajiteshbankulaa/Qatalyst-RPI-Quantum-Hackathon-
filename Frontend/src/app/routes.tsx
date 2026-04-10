import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ScenariosPage } from "./pages/ScenariosPage";
import { ScenarioWorkspacePage } from "./pages/ScenarioWorkspacePage";
import { RiskPage } from "./pages/RiskPage";
import { ForecastPage } from "./pages/ForecastPage";
import { OptimizePage } from "./pages/OptimizePage";
import { BenchmarksPage } from "./pages/BenchmarksPage";
import { BenchmarkDetailPage } from "./pages/BenchmarkDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/login", Component: LoginPage },
  {
    path: "/app",
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: "scenarios", Component: ScenariosPage },
      { path: "scenarios/workspace", Component: ScenarioWorkspacePage },
      { path: "risk", Component: RiskPage },
      { path: "forecast", Component: ForecastPage },
      { path: "optimize", Component: OptimizePage },
      { path: "benchmarks", Component: BenchmarksPage },
      { path: "benchmarks/:id", Component: BenchmarkDetailPage },
      { path: "reports", Component: ReportsPage },
      { path: "integrations", Component: IntegrationsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
