import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../tests/test-utils";
import { LoginPage } from "./LoginPage";

// Mock the useAuth hook
const mockLogin = vi.fn();

vi.mock("../hooks/useAuth", async () => {
  const actual = await vi.importActual("../hooks/useAuth");
  return {
    ...(actual as object),
    useAuth: () => ({
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays demo credentials", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/admin@ims.local/i)).toBeInTheDocument();
    expect(screen.getByText(/admin123/i)).toBeInTheDocument();
  });

  it("has password visibility toggle", () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByTitle(/show/i);
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("enables submit button when form is valid", async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    expect(submitButton).not.toBeDisabled();

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    expect(submitButton).not.toBeDisabled();
  });

  it("shows loading state when submitting", async () => {
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/signing in/i);
    });
  });

  it("calls login with correct credentials", async () => {
    mockLogin.mockResolvedValue({});

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "admin@ims.local");
    await userEvent.type(passwordInput, "admin123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "admin@ims.local",
        password: "admin123",
      });
    });
  });
});
