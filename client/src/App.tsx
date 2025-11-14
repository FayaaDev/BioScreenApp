import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import UpcomingTests from "@/pages/upcoming_tests";
import Signup from "@/pages/signup";
import Admin from "@/pages/admin";
import CompletedTests from "@/pages/completed_tests";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";
import { initializeMobileApp } from "@/lib/capacitor";
import i18n from "./i18n";

// Redirect component for wouter
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">جاري التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      
      {/* Redirect homepage and onboarding to admin */}
      <Route path="/">
        {() => <Redirect to="/admin" />}
      </Route>
      <Route path="/onboarding">
        {() => <Redirect to="/admin" />}
      </Route>
      
      {isAuthenticated ? (
        <>
          <Route path="/upcoming" component={UpcomingTests} />
          <Route path="/completed" component={CompletedTests} />
          <Route path="/profile" component={Profile} />
        </>
      ) : null}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize mobile app features when running as native app
  useEffect(() => {
    initializeMobileApp();
    // Set default language and RTL
    i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
    console.log('Setting RTL to: true');
    console.log('Current language: ar');
    console.log('App layout – current language: ar');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
