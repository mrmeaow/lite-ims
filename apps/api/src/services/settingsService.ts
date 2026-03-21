import { db } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";

export interface Settings {
  siteName: string;
  siteDescription: string;
  lowStockThreshold: number;
  currency: string;
  dateFormat: string;
  timezone: string;
  itemsPerPage: number;
  allowNegativeStock: boolean;
  requireReasonForStockMovement: boolean;
  onboardingCompleted: boolean;
  onboardingData: any;
}

export interface OnboardingStepStatus {
  stepId: string;
  completed: boolean;
  completedAt?: string;
}

export interface OnboardingData {
  currentStep: number;
  steps: OnboardingStepStatus[];
  completedAt?: string;
}

const DEFAULT_SETTINGS: Settings = {
  siteName: "Inventory Management System",
  siteDescription: "Professional inventory tracking and management",
  lowStockThreshold: 10,
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  timezone: "UTC",
  itemsPerPage: 20,
  allowNegativeStock: false,
  requireReasonForStockMovement: false,
  onboardingCompleted: false,
  onboardingData: {},
};

export class SettingsService {
  async getSettings(): Promise<Settings> {
    const settings = await db.settings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      return this.createDefaultSettings();
    }

    return this.formatSettingsResponse(settings);
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const existing = await db.settings.findFirst();

    if (!existing) {
      // Create settings with provided data
      const created = await db.settings.create({
        data: {
          ...DEFAULT_SETTINGS,
          ...data,
        },
      });
      return this.formatSettingsResponse(created);
    }

    const updated = await db.settings.update({
      where: { id: existing.id },
      data,
    });

    return this.formatSettingsResponse(updated);
  }

  async updateOnboardingData(onboardingData: any): Promise<Settings> {
    const existing = await db.settings.findFirst();

    if (!existing) {
      const created = await db.settings.create({
        data: {
          ...DEFAULT_SETTINGS,
          onboardingData,
        },
      });
      return this.formatSettingsResponse(created);
    }

    const updated = await db.settings.update({
      where: { id: existing.id },
      data: { onboardingData },
    });

    return this.formatSettingsResponse(updated);
  }

  async completeOnboarding(): Promise<Settings> {
    const existing = await db.settings.findFirst();

    if (!existing) {
      const created = await db.settings.create({
        data: {
          ...DEFAULT_SETTINGS,
          onboardingCompleted: true,
          onboardingData: { completedAt: new Date().toISOString() },
        },
      });
      return this.formatSettingsResponse(created);
    }

    const updated = await db.settings.update({
      where: { id: existing.id },
      data: {
        onboardingCompleted: true,
        onboardingData: {
          ...(existing.onboardingData as any),
          completedAt: new Date().toISOString(),
        },
      },
    });

    return this.formatSettingsResponse(updated);
  }

  async resetToDefaults(): Promise<Settings> {
    const existing = await db.settings.findFirst();

    if (!existing) {
      return this.createDefaultSettings();
    }

    const updated = await db.settings.update({
      where: { id: existing.id },
      data: DEFAULT_SETTINGS,
    });

    return this.formatSettingsResponse(updated);
  }

  private async createDefaultSettings(): Promise<Settings> {
    const settings = await db.settings.create({
      data: DEFAULT_SETTINGS,
    });

    return this.formatSettingsResponse(settings);
  }

  private formatSettingsResponse(settings: {
    id: string;
    siteName: string;
    siteDescription: string | null;
    lowStockThreshold: number;
    currency: string;
    dateFormat: string;
    timezone: string;
    itemsPerPage: number;
    allowNegativeStock: boolean;
    requireReasonForStockMovement: boolean;
    onboardingCompleted: boolean;
    onboardingData: any;
    createdAt: Date;
    updatedAt: Date;
  }): Settings {
    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription || DEFAULT_SETTINGS.siteDescription,
      lowStockThreshold: settings.lowStockThreshold,
      currency: settings.currency,
      dateFormat: settings.dateFormat,
      timezone: settings.timezone,
      itemsPerPage: settings.itemsPerPage,
      allowNegativeStock: settings.allowNegativeStock,
      requireReasonForStockMovement: settings.requireReasonForStockMovement,
      onboardingCompleted: settings.onboardingCompleted,
      onboardingData: settings.onboardingData,
    };
  }
}

export const settingsService = new SettingsService();
