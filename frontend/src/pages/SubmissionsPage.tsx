import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { submissionsAPI } from "../services/api";
import type { SubmissionList } from "../types";
import { Layout } from "../components/Layout";

export const SubmissionsPage = () => {
    const [submissions, setSubmissions] = useState<SubmissionList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await submissionsAPI.list();
                // Extract results from paginated response
                setSubmissions(response.data.results);
            } catch (error) {
                console.error("Failed to fetch submissions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Accepted":
                return "bg-green-500/20 text-green-400";
            case "Wrong Answer":
                return "bg-red-500/20 text-red-400";
            case "Time Limit Exceeded":
                return "bg-yellow-500/20 text-yellow-400";
            case "Runtime Error":
            case "Compilation Error":
                return "bg-orange-500/20 text-orange-400";
                return "bg-orange-500/20 text-orange-400 border-orange-500/30"; // Updated
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30"; // Updated
        }
    };

    return (
        <Layout className="py-8 sm:py-12 lg:py-16 animate-fade-in">
            <div className="mb-8 sm:mb-12 lg:mb-16">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
                    Your Submissions
                </h1>
                <p className="text-dark-400 text-base sm:text-lg">
                    Track your progress and review your past solutions.
                </p>
            </div>

            {loading ? (
                <div className="card p-8 sm:p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-dark-400">Loading submissions...</div>
                </div>
            ) : submissions.length === 0 ? (
                <div className="card p-8 sm:p-12 text-center text-dark-400">
                    You haven't made any submissions yet.
                </div>
            ) : (
                <div className="card overflow-hidden border-dark-700/50 shadow-xl shadow-black/20">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-dark-700/50 bg-dark-800/30">
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                                        Problem
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                                        Language
                                    </th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-700/50">
                                {submissions.map((submission) => (
                                    <tr
                                        key={submission.id}
                                        className="group hover:bg-dark-700/30 transition-colors"
                                    >
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <Link
                                                to={`/problems/${submission.problem_slug}`}
                                                className="text-white font-medium hover:text-primary-400 transition-colors text-base sm:text-lg block"
                                            >
                                                {submission.problem_title}
                                            </Link>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <span
                                                className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(
                                                    submission.status
                                                )}`}
                                            >
                                                {submission.status}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                                            <span className="text-dark-300 font-mono text-xs sm:text-sm bg-dark-800/50 px-2 py-1 rounded border border-dark-700/50 whitespace-nowrap">
                                                {submission.language_name}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-dark-400 text-xs sm:text-sm">
                                            {new Date(
                                                submission.created_at
                                            ).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
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
