import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { problemsAPI } from "../services/api";
import type { ProblemList, PaginatedResponse } from "../types";
import { Layout } from "../components/Layout";

export const MyProblemsPage = () => {
    const [problems, setProblems] = useState<ProblemList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">(
        "All"
    );
    const [isPublicFilter, setIsPublicFilter] = useState<"All" | "Public" | "Private">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchProblems();
    }, [filter, isPublicFilter, searchQuery]);

    const fetchProblems = async (cursor?: string) => {
        try {
            if (cursor) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setError("");
            }

            const params: any = {
                cursor,
            };

            if (filter !== "All") {
                params.difficulty = filter;
            }

            if (isPublicFilter === "Public") {
                params.is_public = true;
            } else if (isPublicFilter === "Private") {
                params.is_public = false;
            }

            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const response = await problemsAPI.myProblems(params);

            if (cursor) {
                setProblems((prev) => [...prev, ...response.data.results]);
            } else {
                setProblems(response.data.results);
            }

            setNextCursor(response.data.next);
        } catch (err: any) {
            console.error("Failed to fetch problems:", err);
            setError(
                err.response?.data?.error ||
                    "Failed to load your problems. Please try again."
            );
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (nextCursor && !loadingMore) {
            fetchProblems(nextCursor);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProblems();
    };

    const filteredProblems =
        filter === "All"
            ? problems
            : problems.filter((p) => p.difficulty === filter);

    return (
        <Layout className="py-8 sm:py-12 lg:py-16 animate-fade-in">
            <div className="w-full">
                <div className="card p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-black">
                            My Problems
                        </h1>
                        <Link
                            to="/problems/create"
                            className="btn-primary py-2 px-4 text-sm sm:text-base whitespace-nowrap"
                        >
                            + Create Problem
                        </Link>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search problems..."
                                className="input-field flex-1"
                            />
                            <button
                                type="submit"
                                className="btn-primary px-4 py-2 whitespace-nowrap"
                            >
                                Search
                            </button>
                        </form>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-black">
                                    Difficulty:
                                </span>
                                <select
                                    value={filter}
                                    onChange={(e) =>
                                        setFilter(
                                            e.target.value as
                                                | "All"
                                                | "Easy"
                                                | "Medium"
                                                | "Hard"
                                        )
                                    }
                                    className="input-field text-sm py-1 px-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-black">
                                    Visibility:
                                </span>
                                <select
                                    value={isPublicFilter}
                                    onChange={(e) =>
                                        setIsPublicFilter(
                                            e.target.value as
                                                | "All"
                                                | "Public"
                                                | "Private"
                                        )
                                    }
                                    className="input-field text-sm py-1 px-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Public">Public</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-gray-600">
                            Loading your problems...
                        </div>
                    ) : filteredProblems.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">
                                {searchQuery
                                    ? "No problems found matching your search."
                                    : "You haven't created any problems yet."}
                            </p>
                            <Link
                                to="/problems/create"
                                className="btn-primary inline-block"
                            >
                                Create Your First Problem
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {filteredProblems.map((problem) => (
                                    <Link
                                        key={problem.id}
                                        to={`/problems/${problem.slug}/edit`}
                                        className="block card p-4 sm:p-5 hover:bg-gray-50 transition-colors border-2 border-black"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg sm:text-xl font-semibold text-black">
                                                        {problem.title}
                                                    </h3>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded border-2 border-black ${
                                                            problem.difficulty ===
                                                            "Easy"
                                                                ? "bg-green-100 text-green-800"
                                                                : problem.difficulty ===
                                                                  "Medium"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {problem.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Created{" "}
                                                    {new Date(
                                                        problem.created_at
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm text-gray-600">
                                                    Edit →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {nextCursor && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingMore
                                            ? "Loading..."
                                            : "Load More"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

