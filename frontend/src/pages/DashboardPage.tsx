import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { problemsAPI } from "../services/api";
import type { ProblemList } from "../types";
import { Layout } from "../components/Layout";

export const DashboardPage = () => {
    const [problems, setProblems] = useState<ProblemList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await problemsAPI.list({ page_size: 5 });
                // Extract results from paginated response
                setProblems(response.data.results);
            } catch (error) {
                console.error("Failed to fetch problems:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    const stats = {
        easy: problems.filter((p) => p.difficulty === "Easy").length,
        medium: problems.filter((p) => p.difficulty === "Medium").length,
        hard: problems.filter((p) => p.difficulty === "Hard").length,
        total: problems.length,
    };

    return (
        <Layout className="py-8 sm:py-12 lg:py-16 animate-fade-in">
            {/* Header Section */}
            <div className="mb-8 sm:mb-12 lg:mb-16">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 tracking-tight">
                    Welcome back,{" "}
                    <span className="text-gray-700">Developer</span>
                </h1>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                    Ready to solve some problems today?
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
                <div className="card p-4 sm:p-6 lg:p-8 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
                    <div className="text-gray-600 text-xs sm:text-sm mb-2 font-medium uppercase tracking-wider">
                        Total Solved
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black group-hover:text-gray-700 transition-colors">
                        {stats.total}
                    </div>
                </div>
                <div className="card p-4 sm:p-6 lg:p-8 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
                    <div className="text-gray-600 text-xs sm:text-sm mb-2 font-medium uppercase tracking-wider">
                        Easy
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700 group-hover:text-black transition-colors">
                        {stats.easy}
                    </div>
                </div>
                <div className="card p-4 sm:p-6 lg:p-8 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
                    <div className="text-gray-600 text-xs sm:text-sm mb-2 font-medium uppercase tracking-wider">
                        Medium
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-600 group-hover:text-black transition-colors">
                        {stats.medium}
                    </div>
                </div>
                <div className="card p-4 sm:p-6 lg:p-8 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
                    <div className="text-gray-600 text-xs sm:text-sm mb-2 font-medium uppercase tracking-wider">
                        Hard
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black group-hover:text-gray-800 transition-colors">
                        {stats.hard}
                    </div>
                </div>
            </div>

            {/* Recent Problems */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                        Recent Problems
                    </h2>
                    <Link
                        to="/problems"
                        className="text-black hover:text-gray-700 text-sm font-medium transition-colors flex items-center gap-1 group touch-target underline"
                    >
                        View all
                        <span className="group-hover:translate-x-1 transition-transform">
                            →
                        </span>
                    </Link>
                </div>

                {loading ? (
                    <div className="card p-8 sm:p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
                        <div className="text-gray-600">Loading problems...</div>
                    </div>
                ) : problems.length === 0 ? (
                    <div className="card p-8 sm:p-12 text-center text-gray-600">
                        No problems available yet.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:gap-4">
                        {problems.map((problem) => (
                            <Link
                                key={problem.id}
                                to={`/problems/${problem.slug}`}
                                className="card p-4 sm:p-5 lg:p-6 hover:bg-gray-50 transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div
                                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 border-2 border-black shrink-0 ${
                                                problem.difficulty === "Easy"
                                                    ? "bg-gray-300"
                                                    : problem.difficulty ===
                                                      "Medium"
                                                    ? "bg-gray-500"
                                                    : "bg-black"
                                            }`}
                                        ></div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-black font-medium text-base sm:text-lg group-hover:text-gray-700 transition-colors truncate">
                                                {problem.title}
                                            </h3>
                                            <p className="text-gray-600 text-xs sm:text-sm mt-0.5">
                                                By {problem.created_by}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-xs font-medium border-2 border-black shrink-0 w-fit ${
                                            problem.difficulty === "Easy"
                                                ? "bg-gray-200 text-black"
                                                : problem.difficulty ===
                                                  "Medium"
                                                ? "bg-gray-400 text-black"
                                                : "bg-black text-white"
                                        }`}
                                    >
                                        {problem.difficulty}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
