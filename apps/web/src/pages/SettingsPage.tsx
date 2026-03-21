import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { SettingsResponse } from "@ims/types";
import { toast } from "sonner";
import { Settings as SettingsIcon, Save, RotateCcw, Loader2, RefreshCw } from "lucide-react";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (UTC-5)" },
  { value: "America/Chicago", label: "Central Time (UTC-6)" },
  { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Paris", label: "Paris (UTC+1)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
  { value: "Asia/Kolkata", label: "Mumbai (UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Dhaka (UTC+6)" },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restartingOnboarding, setRestartingOnboarding] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api.get<SettingsResponse>("/settings");
      setSettings(data);
    } catch (error) {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleRestartOnboarding = async () => {
    if (!confirm("Restart the onboarding tour? This will show the tour again on next page load.")) {
      return;
    }

    try {
      setRestartingOnboarding(true);
      await api.patch("/settings/onboarding", {
        onboardingData: { currentStep: 0 },
      });
      await api.patch("/settings/onboarding", {
        onboardingData: { onboardingCompleted: false },
      });
      toast.success("Onboarding will restart on next page load");
      fetchSettings();
    } catch (error) {
      toast.error("Failed to restart onboarding");
    } finally {
      setRestartingOnboarding(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updated = await api.put<SettingsResponse>("/settings", settings);
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) return;

    try {
      const data = await api.post<SettingsResponse>("/settings/reset", {});
      setSettings(data);
      toast.success("Settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset settings");
    }
  };

  const updateSetting = <K extends keyof SettingsResponse>(
    key: K,
    value: SettingsResponse[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-danger-200 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => updateSetting("siteName", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => updateSetting("siteDescription", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Regional</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => updateSetting("currency", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSetting("dateFormat", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {DATE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  updateSetting("lowStockThreshold", parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={0}
                max={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                Items below this quantity will be marked as low stock
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items Per Page
              </label>
              <input
                type="number"
                value={settings.itemsPerPage}
                onChange={(e) =>
                  updateSetting("itemsPerPage", parseInt(e.target.value) || 20)
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={5}
                max={100}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Allow Negative Stock
                </p>
                <p className="text-xs text-gray-500">
                  Permit stock quantities below zero
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSetting("allowNegativeStock", !settings.allowNegativeStock)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowNegativeStock
                    ? "bg-primary-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowNegativeStock ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Require Reason for Stock Movement
                </p>
                <p className="text-xs text-gray-500">
                  Force users to provide a reason when recording movements
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSetting(
                    "requireReasonForStockMovement",
                    !settings.requireReasonForStockMovement
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.requireReasonForStockMovement
                    ? "bg-primary-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.requireReasonForStockMovement
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Version</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Environment</span>
              <span className="text-sm font-medium text-gray-900">
                {import.meta.env.PROD ? "Production" : "Development"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Onboarding</span>
              <span className="text-sm font-medium text-gray-900">
                {settings.onboardingCompleted ? "Completed" : "Not Started"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleRestartOnboarding}
              disabled={restartingOnboarding}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${restartingOnboarding ? "animate-spin" : ""}`} />
              Restart Onboarding Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
