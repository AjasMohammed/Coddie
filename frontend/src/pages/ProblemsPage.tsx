import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { problemsAPI } from "../services/api";
import type { ProblemList } from "../types";
import { Layout } from "../components/Layout";

export const ProblemsPage = () => {
    const [problems, setProblems] = useState<ProblemList[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">(
        "All"
    );

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await problemsAPI.list();
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

    const filteredProblems =
        filter === "All"
            ? problems
            : problems.filter((p) => p.difficulty === filter);

    return (
        <Layout className="py-8 sm:py-12 lg:py-16 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-2 sm:mb-3 tracking-tight">
                        Problems
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                        Challenge yourself with our collection of algorithmic
                        problems.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 border-2 border-black bg-gray-100 p-1.5 w-full md:w-auto">
                    {(["All", "Easy", "Medium", "Hard"] as const).map(
                        (level) => (
                            <button
                                key={level}
                                onClick={() => setFilter(level)}
                                className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium transition-all duration-200 touch-target border-2 border-black ${
                                    filter === level
                                        ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                        : "text-black hover:bg-gray-200 bg-white"
                                }`}
                            >
                                {level}
                            </button>
                        )
                    )}
                </div>
            </div>

            {loading ? (
                <div className="card p-8 sm:p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
                    <div className="text-gray-600">Loading problems...</div>
                </div>
            ) : filteredProblems.length === 0 ? (
                <div className="card p-8 sm:p-12 text-center text-gray-600">
                    No problems found matching your criteria.
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b-2 border-black bg-gray-100">
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-black uppercase tracking-wider w-full">
                                        Title
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        Difficulty
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        Acceptance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black">
                                {filteredProblems.map((problem) => (
                                    <tr
                                        key={problem.id}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <div className="w-5 h-5 border-2 border-black group-hover:bg-gray-300 transition-colors"></div>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <Link
                                                to={`/problems/${problem.slug}`}
                                                className="text-black font-medium hover:text-gray-700 transition-colors text-base sm:text-lg block"
                                            >
                                                {problem.title}
                                            </Link>
                                            <div className="text-gray-600 text-xs sm:text-sm mt-1">
                                                By {problem.created_by}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <span
                                                className={`inline-flex items-center px-2.5 sm:px-3 py-1 text-xs font-medium border-2 border-black whitespace-nowrap ${
                                                    problem.difficulty ===
                                                    "Easy"
                                                        ? "bg-gray-200 text-black"
                                                        : problem.difficulty ===
                                                          "Medium"
                                                        ? "bg-gray-400 text-black"
                                                        : "bg-black text-white"
                                                }`}
                                            >
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-gray-600 font-mono text-sm">
                                            --
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};
