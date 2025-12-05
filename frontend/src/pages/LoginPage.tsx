import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/");
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                    "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 sm:py-12">
            <div className="max-w-md w-full space-y-6 sm:space-y-8 animate-fade-in">
                <div className="card p-6 sm:p-8 lg:p-10 bg-white">
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                            Challenger
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Sign in to your account
                        </p>
                    </div>

                    <form
                        className="space-y-5 sm:space-y-6"
                        onSubmit={handleSubmit}
                    >
                        {error && (
                            <div className="bg-gray-100 border-2 border-black text-black px-4 py-3 text-sm sm:text-base">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-black mb-2"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field touch-target"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-black mb-2"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="input-field touch-target"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        <div className="text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="text-black hover:text-gray-700 font-medium transition-colors underline"
                            >
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
