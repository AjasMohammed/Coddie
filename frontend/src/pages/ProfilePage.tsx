import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

export const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <Layout className="max-w-4xl py-12 animate-fade-in">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Your Profile
                </h1>
                <p className="text-dark-400 text-lg">
                    Manage your account settings and view your progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="card p-8 text-center border-dark-700/50 shadow-xl shadow-black/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6 shadow-lg shadow-primary-500/30 ring-4 ring-dark-800">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {user?.username}
                            </h2>
                            <p className="text-dark-400 font-medium">
                                {user?.email}
                            </p>

                            <div className="mt-8 pt-8 border-t border-dark-700/50">
                                <div className="text-dark-400 text-sm uppercase tracking-wider font-medium mb-2">
                                    Member Since
                                </div>
                                <div className="text-white font-medium">
                                    November 2023
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats & Settings */}
                <div className="md:col-span-2 space-y-8">
                    {/* Quick Actions */}
                    <div className="card p-8 border-dark-700/50 shadow-xl shadow-black/20">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-primary-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/problems/my"
                                className="bg-dark-900/50 p-6 rounded-xl border border-dark-700/50 hover:border-primary-500/50 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                                        <svg
                                            className="w-6 h-6 text-primary-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                            My Problems
                                        </h4>
                                        <p className="text-sm text-dark-400">
                                            View and manage your created problems
                                        </p>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-dark-400 group-hover:text-primary-400 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </Link>
                            <Link
                                to="/problems/create"
                                className="bg-dark-900/50 p-6 rounded-xl border border-dark-700/50 hover:border-primary-500/50 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                                        <svg
                                            className="w-6 h-6 text-primary-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                            Create Problem
                                        </h4>
                                        <p className="text-sm text-dark-400">
                                            Add a new problem to the platform
                                        </p>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-dark-400 group-hover:text-primary-400 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="card p-8 border-dark-700/50 shadow-xl shadow-black/20">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-primary-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Statistics
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700/50 text-center hover:border-primary-500/30 transition-colors group">
                                <div className="text-3xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                    0
                                </div>
                                <div className="text-xs text-dark-400 uppercase tracking-wider font-medium">
                                    Solved
                                </div>
                            </div>
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700/50 text-center hover:border-primary-500/30 transition-colors group">
                                <div className="text-3xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                    0
                                </div>
                                <div className="text-xs text-dark-400 uppercase tracking-wider font-medium">
                                    Attempted
                                </div>
                            </div>
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700/50 text-center hover:border-primary-500/30 transition-colors group">
                                <div className="text-3xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                    0%
                                </div>
                                <div className="text-xs text-dark-400 uppercase tracking-wider font-medium">
                                    Acceptance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="card p-8 border-dark-700/50 shadow-xl shadow-black/20">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-primary-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            Account Settings
                        </h3>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2 uppercase tracking-wider">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={user?.username}
                                    disabled
                                    className="input-field bg-dark-900/50 text-dark-400 cursor-not-allowed border-dark-700/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2 uppercase tracking-wider">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email}
                                    disabled
                                    className="input-field bg-dark-900/50 text-dark-400 cursor-not-allowed border-dark-700/50"
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="button"
                                    className="btn-primary w-full sm:w-auto"
                                >
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
