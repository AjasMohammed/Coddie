import { formatInputArray, formatOutputValue } from "../utils/testCaseParser";

interface TestCaseFailure {
    status: string;
    input?: any[];
    expected?: any;
    actual?: any;
    case?: number;
    error?: string;
}

interface TestResultDisplayProps {
    output: string;
}

export const TestResultDisplay = ({ output }: TestResultDisplayProps) => {
    const parseOutput = (): TestCaseFailure | null => {
        if (!output) return null;

        // Try to extract JSON from the output string
        let jsonStr = output.trim();

        // If output contains JSON, try to extract it
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            // Try to parse as JSON
            const parsed = JSON.parse(jsonStr);
            if (parsed.status && parsed.status !== "Accepted") {
                return parsed as TestCaseFailure;
            }
        } catch {
            // Not JSON, return null to show raw output
            return null;
        }

        return null;
    };

    const failure = parseOutput();

    if (!failure) {
        // Show raw output if not a structured error
        return (
            <div className="text-black whitespace-pre-wrap font-mono text-sm">
                {output}
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Wrong Answer":
                return {
                    bg: "bg-red-50",
                    border: "border-red-500",
                    text: "text-red-700",
                    icon: "✗",
                };
            case "Runtime Error":
                return {
                    bg: "bg-orange-50",
                    border: "border-orange-500",
                    text: "text-orange-700",
                    icon: "⚠",
                };
            case "Time Limit Exceeded":
                return {
                    bg: "bg-yellow-50",
                    border: "border-yellow-500",
                    text: "text-yellow-700",
                    icon: "⏱",
                };
            default:
                return {
                    bg: "bg-gray-50",
                    border: "border-gray-500",
                    text: "text-gray-700",
                    icon: "ℹ",
                };
        }
    };

    const statusStyle = getStatusColor(failure.status);

    return (
        <div
            className={`${statusStyle.bg} border-2 ${statusStyle.border} rounded-lg p-4 space-y-4`}
        >
            {/* Status Header */}
            <div className="flex items-center gap-2">
                <span className={`text-xl ${statusStyle.text}`}>
                    {statusStyle.icon}
                </span>
                <h3 className={`font-bold text-lg ${statusStyle.text}`}>
                    {failure.status}
                </h3>
                {failure.case !== undefined && (
                    <span className="text-sm text-gray-600">
                        (Test Case {failure.case + 1})
                    </span>
                )}
            </div>

            {/* Error Message */}
            {failure.error && (
                <div className="bg-white border-2 border-black p-3 rounded">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Error Message
                    </div>
                    <div className="font-mono text-sm text-black">
                        {failure.error}
                    </div>
                </div>
            )}

            {/* Test Case Details */}
            <div className="space-y-3">
                {/* Input - Always show if available */}
                {failure.input !== undefined && (
                    <div>
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                            <span>Test Case Input</span>
                        </div>
                        <div className="bg-white border-2 border-black p-3 rounded font-mono text-sm text-black break-all">
                            {Array.isArray(failure.input)
                                ? formatInputArray(failure.input)
                                : JSON.stringify(failure.input)}
                        </div>
                    </div>
                )}

                {/* Expected Output - Always show if available */}
                {failure.expected !== undefined && (
                    <div>
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="text-base">✓</span>
                            <span>Expected Output</span>
                        </div>
                        <div className="bg-green-50 border-2 border-green-500 p-3 rounded font-mono text-sm text-green-900 break-all">
                            {formatOutputValue(failure.expected)}
                        </div>
                    </div>
                )}

                {/* Actual Output - Show if available (for comparison) */}
                {failure.actual !== undefined && (
                    <div>
                        <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="text-base">✗</span>
                            <span>Your Output</span>
                        </div>
                        <div className="bg-red-50 border-2 border-red-500 p-3 rounded font-mono text-sm text-red-900 break-all">
                            {formatOutputValue(failure.actual)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

