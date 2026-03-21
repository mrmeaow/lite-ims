import { useEffect, useCallback } from "react";
import { useAuthStore } from "../store";
import type { LoginRequest, RegisterRequest, UserResponse } from "@ims/types";

const API_BASE = "/api";

export function useAuth() {
  const { user, setUser, isAuthenticated, isLoading, setLoading, logout } = useAuthStore();

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data as UserResponse);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [setUser, setLoading]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || "Login failed");
    }

    setUser(result.data.user as UserResponse);
    return result.data;
  }, [setUser]);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || "Registration failed");
    }

    setUser(result.data.user as UserResponse);
    return result.data;
  }, [setUser]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
}
