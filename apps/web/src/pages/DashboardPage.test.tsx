import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../tests/test-utils";
import { DashboardPage } from "./DashboardPage";

const mockGet = vi.fn();

vi.mock("../utils/api", () => ({
  api: {
    get: mockGet,
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDashboardStats = {
    totalItems: 150,
    totalCategories: 10,
    lowStockItems: 5,
    outOfStockItems: 2,
    totalValue: 25000,
    recentMovements: [
      {
        id: "1",
        itemId: "item-1",
        quantity: 10,
        type: "IN" as const,
        createdAt: new Date().toISOString(),
        item: {
          id: "item-1",
          name: "Test Item",
          unit: "piece",
        },
      },
    ],
  };

  it("shows loading state initially", async () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<DashboardPage />);

    // Check for loading spinner (by its CSS class since it doesn't have a role)
    expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();
  });

  it("displays dashboard stats", async () => {
    mockGet.mockResolvedValue(mockDashboardStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Total Items")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("Categories")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Low Stock")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Out of Stock")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("displays total value formatted", async () => {
    mockGet.mockResolvedValue(mockDashboardStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("$25,000")).toBeInTheDocument();
    });
  });

  it("shows recent stock movements", async () => {
    mockGet.mockResolvedValue(mockDashboardStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Recent Stock Movements")).toBeInTheDocument();
      expect(screen.getByText("Test Item")).toBeInTheDocument();
      expect(screen.getByText("+10 piece")).toBeInTheDocument();
    });
  });

  it("shows empty state when no movements", async () => {
    mockGet.mockResolvedValue({
      ...mockDashboardStats,
      recentMovements: [],
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No recent stock movements")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    mockGet.mockRejectedValue(new Error("API Error"));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard")).toBeInTheDocument();
    });
  });
});
