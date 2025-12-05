import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { authAPI } from "../services/api";
import type { UserStats } from "../types";

interface AuthContextType {
    user: UserStats | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string
    ) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const response = await authAPI.me();
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            // Clear tokens if profile fetch fails
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authAPI.login(email, password);
        const { access, refresh } = response.data;
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        await fetchUser();
    };

    const register = async (
        username: string,
        email: string,
        password: string
    ) => {
        await authAPI.register({ username, email, password });
        // Auto-login after registration
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                refreshUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
