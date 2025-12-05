import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/problems", label: "Problems" },
    { to: "/submissions", label: "Submissions" },
    { to: "/problems/create", label: "Create Problem" },
];

export const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleToggleMobile = () => {
        setIsMobileOpen((previous) => !previous);
    };

    const handleCloseMobile = () => {
        setIsMobileOpen(false);
    };

    return (
        <header className="sticky inset-x-0 top-0 z-40 border-b-2 border-black bg-white shadow-[0_4px_0_0_rgba(0,0,0,1)]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                        <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-black text-sm font-semibold text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            C
                        </span>
                        <span className="text-base font-semibold tracking-tight text-black sm:text-lg">
                            Challenger
                        </span>
                    </Link>
                    {isAuthenticated && (
                        <nav className="ml-6 hidden items-center gap-1 border-2 border-black bg-gray-100 px-1 py-1 text-sm sm:flex">
                            {navItems.map((item) => {
                                const isActive =
                                    item.to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(item.to);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`px-3 py-1.5 font-medium transition-colors ${
                                            isActive
                                                ? "bg-black text-white"
                                                : "text-black hover:bg-gray-200"
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/profile"
                                className="hidden items-center gap-2 border-2 border-black bg-white px-2 py-1 text-sm font-medium text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 sm:inline-flex"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center border-2 border-black bg-black text-xs font-semibold text-white">
                                    {user?.username?.[0]?.toUpperCase()}
                                </span>
                                <span className="max-w-[8rem] truncate">
                                    {user?.username}
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={logout}
                                className="hidden border-2 border-black bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100 sm:inline-flex"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="hidden items-center gap-2 sm:flex">
                            <Link
                                to="/login"
                                className="px-3 py-1.5 text-xs font-semibold text-black hover:text-gray-700"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="border-2 border-black bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleToggleMobile}
                        className="inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:hidden"
                        aria-label="Toggle navigation menu"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {isMobileOpen ? (
                                <path
                                    d="M6 18L18 6M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            ) : (
                                <path
                                    d="M4 7H20M4 12H20M4 17H20"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {isMobileOpen && (
                <div className="border-t-2 border-black bg-white px-4 pb-4 pt-3 text-sm text-black sm:hidden">
                    {isAuthenticated ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-2 border-black bg-gray-100 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-black text-sm font-semibold text-white">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-black">
                                            {user?.username}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            Profile
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to="/profile"
                                    onClick={handleCloseMobile}
                                    className="px-2 py-1 text-xs font-semibold text-black hover:text-gray-700"
                                >
                                    Open
                                </Link>
                            </div>

                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    const isActive =
                                        item.to === "/"
                                            ? location.pathname === "/"
                                            : location.pathname.startsWith(
                                                  item.to
                                              );

                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            onClick={handleCloseMobile}
                                            className={`flex items-center justify-between border-2 border-black px-3 py-2 font-medium ${
                                                isActive
                                                    ? "bg-black text-white"
                                                    : "bg-white text-black hover:bg-gray-100"
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    handleCloseMobile();
                                }}
                                className="mt-1 inline-flex w-full items-center justify-center border-2 border-black bg-white px-3 py-2 text-sm font-semibold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Link
                                to="/login"
                                onClick={handleCloseMobile}
                                className="flex items-center justify-between border-2 border-black bg-white px-3 py-2 font-medium text-black hover:bg-gray-100"
                            >
                                <span>Login</span>
                            </Link>
                            <Link
                                to="/register"
                                onClick={handleCloseMobile}
                                className="flex items-center justify-between border-2 border-black bg-black px-3 py-2 font-semibold text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-900"
                            >
                                <span>Sign up</span>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};
