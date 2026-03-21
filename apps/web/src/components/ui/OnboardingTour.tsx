import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../utils/api";
import { X, ChevronLeft, ChevronRight, CheckCircle, Settings as SettingsIcon } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  path: string;
  target?: string;
  hasSetup?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to IMS! 👋",
    description:
      "Let's take a quick tour to help you get familiar with the Inventory Management System. You'll learn how to navigate and use the main features.",
    path: "/dashboard",
  },
  {
    id: "settings-setup",
    title: "Initial Setup",
    description:
      "Let's configure your system settings first. Set your preferred currency, date format, and inventory preferences to get started.",
    path: "/settings",
    hasSetup: true,
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description:
      "Your dashboard shows key metrics at a glance: total items, categories, low stock alerts, and recent activity. This is your command center for inventory management.",
    path: "/dashboard",
  },
  {
    id: "items",
    title: "Manage Items",
    description:
      "This is where you'll spend most of your time. Add new items, edit existing ones, track quantities, set prices, and organize by category.",
    path: "/items",
  },
  {
    id: "categories",
    title: "Organize with Categories",
    description:
      "Keep your inventory organized by creating categories. You can create nested categories for better organization of your items.",
    path: "/categories",
  },
  {
    id: "stock-movements",
    title: "Track Stock Movements",
    description:
      "Record stock movements like receiving new inventory, shipping orders, adjustments, and transfers. Every movement is tracked for accountability.",
    path: "/stock",
  },
  {
    id: "users",
    title: "User Management",
    description:
      "Manage team members and their access. Admin users can create accounts, assign roles, and control permissions.",
    path: "/users",
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    description:
      "You've completed the onboarding tour. You can always access help from the settings menu. Start managing your inventory with confidence!",
    path: "/dashboard",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>({
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timezone: "UTC",
    lowStockThreshold: 10,
    itemsPerPage: 20,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const isSettingsStep = step?.hasSetup;

  // Load settings and onboarding state from settings on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const settingsData = await api.get<Record<string, unknown>>("/settings");
        if (settingsData["onboardingCompleted"] as boolean) {
          setOnboardingCompleted(true);
          onComplete?.();
          return;
        }

        const onboardingData = settingsData["onboardingData"] as { currentStep?: number } | undefined;
        if (onboardingData?.currentStep !== undefined) {
          setCurrentStep(Math.min(onboardingData.currentStep, ONBOARDING_STEPS.length - 1));
        }

        // Load existing settings
        setSettings({
          currency: (settingsData["currency"] as string) || "USD",
          dateFormat: (settingsData["dateFormat"] as string) || "MM/DD/YYYY",
          timezone: (settingsData["timezone"] as string) || "UTC",
          lowStockThreshold: (settingsData["lowStockThreshold"] as number) || 10,
          itemsPerPage: (settingsData["itemsPerPage"] as number) || 20,
        });
        setSettingsLoaded(true);
      } catch (error) {
        console.error("Failed to load onboarding state:", error);
        setSettingsLoaded(true);
      }
    };

    loadOnboardingState();
  }, []);

  // Navigate to step's path when step changes
  useEffect(() => {
    if (step && location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [currentStep, step?.path, navigate, location.pathname]);

  const saveProgress = async (stepIndex: number) => {
    try {
      setIsSaving(true);
      await api.patch("/settings/onboarding", {
        onboardingData: {
          currentStep: stepIndex,
          lastVisited: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await api.put("/settings", {
        currency: settings["currency"],
        dateFormat: settings["dateFormat"],
        timezone: settings["timezone"],
        lowStockThreshold: settings["lowStockThreshold"],
        itemsPerPage: settings["itemsPerPage"],
      });
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
      return;
    }

    // If on settings step, save settings first
    if (isSettingsStep) {
      const saved = await handleSaveSettings();
      if (!saved) return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await saveProgress(nextStep);
  };

  const handlePrevious = async () => {
    if (isFirstStep) return;

    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    await saveProgress(prevStep);
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      await api.post("/settings/onboarding/complete", {});
      setOnboardingCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleClose = async () => {
    await saveProgress(currentStep);
    onComplete?.();
  };

  if (onboardingCompleted || !settingsLoaded) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isLastStep ? "Tour Complete" : `Step ${currentStep + 1} of ${ONBOARDING_STEPS.length}`}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="mb-6">
            {isLastStep ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{step?.title}</h3>
                <p className="text-gray-600">{step?.description}</p>
              </div>
            ) : isSettingsStep ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Configure Your Preferences</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={settings["currency"] as string}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="USD">USD - $</option>
                      <option value="EUR">EUR - €</option>
                      <option value="GBP">GBP - £</option>
                      <option value="JPY">JPY - ¥</option>
                      <option value="CNY">CNY - ¥</option>
                      <option value="INR">INR - ₹</option>
                      <option value="BDT">BDT - ৳</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={settings["dateFormat"] as string}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={settings["timezone"] as string}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Dhaka">Dhaka</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={settings["lowStockThreshold"] as number}
                      onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      max="1000"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step?.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step?.description}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep || isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                  isLastStep
                    ? "bg-success-600 hover:bg-success-700"
                    : "bg-primary-600 hover:bg-primary-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
