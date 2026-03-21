import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { useUIStore, useAuthStore } from "../store";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ArrowLeftRight,
  Users,
  Shield,
  Settings,
  X,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Items", path: "/items" },
  { icon: FolderTree, label: "Categories", path: "/categories" },
  { icon: ArrowLeftRight, label: "Stock", path: "/stock" },
  { icon: Users, label: "Users", path: "/users", requiresAdmin: true },
  { icon: Shield, label: "Roles", path: "/roles", requiresAdmin: true },
  { icon: Settings, label: "Settings", path: "/settings", requiresAdmin: true },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const isAdmin = user?.roles.some((role) => role.name === "admin") ?? false;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Package className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-semibold">IMS</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems
            .filter((item) => !item.requiresAdmin || isAdmin)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-primary-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Inventory Management System
          </div>
          <div className="text-xs text-gray-500">v1.0.0</div>
          <div className="mt-2 text-xs text-gray-500">
            Made by{" "}
            <a
              href="https://github.com/mrmeaow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              @mrmeaow
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}