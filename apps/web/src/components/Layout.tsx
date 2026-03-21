import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "../store";
import { OnboardingTour } from "./ui/OnboardingTour";

export function Layout() {
  const { sidebarOpen } = useUIStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Import api dynamically to avoid circular dependencies
        const { api } = await import("../utils/api");
        const settings = await api.get<Record<string, unknown>>("/settings");
        
        if (!(settings["onboardingCompleted"] as boolean)) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setOnboardingChecked(true);
      }
    };

    checkOnboarding();
  }, []);

  if (!onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}