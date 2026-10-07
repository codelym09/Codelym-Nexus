import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Workflows from "./pages/Workflows";
import WorkflowDetail from "./pages/WorkflowDetail";
import LogIngest from "./pages/LogIngest";
import Billing from "./pages/Billing";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Profile from "@/pages/Profile";
import CommerceMVP from "@/pages/CommerceMVP";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/workflows"} component={Workflows} />
      <Route path={"/workflows/:id"} component={WorkflowDetail} />
      <Route path={"/ingest"} component={LogIngest} />
      <Route path={"/billing"} component={Billing} />
      <Route path={"/security"} component={SecurityDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isCommerce = typeof window !== "undefined" && window.location.pathname.startsWith("/store");
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {isCommerce ? <CommerceMVP /> : <DashboardLayout><Router /></DashboardLayout>}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
