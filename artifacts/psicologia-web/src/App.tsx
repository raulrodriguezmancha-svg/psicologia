import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Home from "@/pages/home";
import Services from "@/pages/services";
import About from "@/pages/about";
import Reviews from "@/pages/reviews";
import Booking from "@/pages/booking";
import BookingConfirmation from "@/pages/booking-confirmation";
import Admin from "@/pages/admin";
import ReviewForm from "@/pages/review-form";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 w-full relative">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicLayout><Home /></PublicLayout>} />
      <Route path="/servicios" component={() => <PublicLayout><Services /></PublicLayout>} />
      <Route path="/sobre-mi" component={() => <PublicLayout><About /></PublicLayout>} />
      <Route path="/resenas" component={() => <PublicLayout><Reviews /></PublicLayout>} />
      <Route path="/reservar" component={() => <PublicLayout><Booking /></PublicLayout>} />
      <Route path="/reservar/confirmacion" component={() => <PublicLayout><BookingConfirmation /></PublicLayout>} />
      <Route path="/resena/:token" component={() => <PublicLayout><ReviewForm /></PublicLayout>} />
      <Route path="/admin" component={Admin} />
      <Route component={() => <PublicLayout><NotFound /></PublicLayout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
