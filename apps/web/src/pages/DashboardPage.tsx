import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { DashboardStats, StockMovementResponse } from "@ims/types";
import { Package, FolderTree, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { getCurrencySymbol } from "../utils/currency";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStats>("/inventory/dashboard");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard</div>;
  }

  const currencySymbol = getCurrencySymbol(stats.currency);

  const statCards = [
    {
      label: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "bg-primary-500",
    },
    {
      label: "Categories",
      value: stats.totalCategories,
      icon: FolderTree,
      color: "bg-success-500",
    },
    {
      label: "Low Stock",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "bg-warning-500",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStockItems,
      icon: XCircle,
      color: "bg-danger-500",
    },
    {
      label: "Total Value",
      value: `${currencySymbol}${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-primary-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Recent Stock Movements</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentMovements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No recent stock movements
            </div>
          ) : (
            stats.recentMovements.map((movement) => (
              <MovementItem key={movement.id} movement={movement} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MovementItem({ movement }: { movement: StockMovementResponse }) {
  const typeColors = {
    IN: "bg-success-500",
    OUT: "bg-danger-500",
    ADJUSTMENT: "bg-warning-500",
    TRANSFER: "bg-primary-500",
  };

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${typeColors[movement.type]}`}>
          <span className="text-white text-xs font-bold">
            {movement.type}
          </span>
        </div>
        <div>
          <p className="font-medium">{movement.item?.name}</p>
          <p className="text-sm text-gray-500">
            {movement.type === "OUT" ? "-" : "+"}
            {movement.quantity} {movement.item?.unit}
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {new Date(movement.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}