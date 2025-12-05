import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { problemsAPI, languagesAPI } from "../services/api";
import Editor from "@monaco-editor/react";
import type { ProgrammingLanguage } from "../types";
import { parseInputString, parseOutputString } from "../utils/testCaseParser";
import type { TestCase } from "../types";
import { readCSVFile } from "../utils/csvParser";

interface TestCaseForm {
    input: string;
    output: string;
}

interface FieldLabelProps {
    htmlFor?: string;
    required?: boolean;
    tooltip: string;
    children: React.ReactNode;
}

const FieldLabel = ({
    htmlFor,
    required,
    tooltip,
    children,
}: FieldLabelProps) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <label
            htmlFor={htmlFor}
            className="flex items-center gap-1.5 text-sm font-medium text-black mb-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span>{children}</span>
            {required && <span className="text-red-500">*</span>}
            <div className="relative inline-block">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500 hover:text-black cursor-help"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                {showTooltip && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs text-black z-10 pointer-events-none">
                        {tooltip}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                    </div>
                )}
            </div>
        </label>
    );
};

export const CreateProblemPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        difficulty: "Easy" | "Medium" | "Hard";
        time_limit: number | null;
        memory_limit: number | null;
        function_name: string;
        return_type: string;
        argument_types: string[];

        language: number | "";
        starter_code: string;
        test_cases: TestCaseForm[];
        is_public: boolean;
    }>({
        title: "",
        description: "",
        difficulty: "Easy",
        time_limit: null,
        memory_limit: null,
        function_name: "twoSum",
        return_type: "integer[]",
        argument_types: [],

        language: "",
        starter_code:
            "class Solution:\n    def twoSum(self, nums, target):\n        # Write your solution here\n        pass",
        test_cases: [{ input: "", output: "" }],
        is_public: true,
    });

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await languagesAPI.list();
                setLanguages(response.data);
            } catch (err) {
                console.error("Failed to fetch languages:", err);
            }
        };
        fetchLanguages();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        // Handle language change - update starter_code with boilerplate
        if (name === "language") {
            const selectedLanguage = languages.find(
                (lang) => lang.id === Number(value)
            );
            setFormData((prev) => ({
                ...prev,
                language: value === "" ? "" : Number(value),
                starter_code:
                    selectedLanguage?.boilerplate || prev.starter_code,
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "time_limit" || name === "memory_limit"
                    ? value === ""
                        ? null
                        : Number(value)
                    : value,
        }));
    };

    const handleTestCaseChange = (
        index: number,
        field: "input" | "output",
        value: string
    ) => {
        const newTestCases = [...formData.test_cases];
        newTestCases[index][field] = value;
        setFormData((prev) => ({ ...prev, test_cases: newTestCases }));
    };

    const addTestCase = () => {
        setFormData((prev) => ({
            ...prev,
            test_cases: [...prev.test_cases, { input: "", output: "" }],
        }));
    };

    const removeTestCase = (index: number) => {
        if (formData.test_cases.length > 1) {
            setFormData((prev) => ({
                ...prev,
                test_cases: prev.test_cases.filter((_, i) => i !== index),
            }));
        }
    };

    const clearAllTestCases = () => {
        setFormData((prev) => ({
            ...prev,
            test_cases: [{ input: "", output: "" }],
        }));
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvUploadError, setCsvUploadError] = useState("");
    const [showCsvInstructions, setShowCsvInstructions] = useState(false);

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvUploadError("Please upload a CSV file (.csv extension)");
            return;
        }

        setCsvUploadError("");

        try {
            const parsedTestCases = await readCSVFile(file);

            if (parsedTestCases.length === 0) {
                setCsvUploadError("CSV file contains no test cases");
                return;
            }

            // Convert parsed test cases to TestCaseForm format
            const newTestCases = parsedTestCases.map((tc) => ({
                input: tc.input,
                output: tc.output,
            }));

            // Replace existing test cases with uploaded ones
            setFormData((prev) => ({
                ...prev,
                test_cases: newTestCases,
            }));

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err: any) {
            setCsvUploadError(
                err.message ||
                    "Failed to parse CSV file. Please check the format."
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setCsvUploadError("");

        // Validate test cases
        const validTestCases = formData.test_cases.filter(
            (tc) => tc.input.trim() && tc.output.trim()
        );

        if (validTestCases.length === 0) {
            setError(
                "At least one test case with both input and output is required."
            );
            setLoading(false);
            return;
        }

        try {
            // Convert test case strings to arrays before sending
            const convertedTestCases: TestCase[] = validTestCases.map(
                (testCase) => ({
                    input: parseInputString(testCase.input),
                    output: parseOutputString(testCase.output),
                })
            );

            const payload: any = {
                ...formData,
                language: formData.language === "" ? null : formData.language,
                test_cases: convertedTestCases,
            };

            // Remove null values for optional fields
            if (payload.time_limit === null) {
                delete payload.time_limit;
            }
            if (payload.memory_limit === null) {
                delete payload.memory_limit;
            }

            await problemsAPI.create(payload);
            navigate("/problems");
        } catch (err: any) {
            console.error("Failed to create problem:", err);
            setError(
                err.response?.data?.detail ||
                    "Failed to create problem. Please check your inputs."
            );
        } finally {
            setLoading(false);
        }
    };

    const DATA_TYPES = [
        "integer",
        "integer[]",
        "string",
        "string[]",
        "boolean",
        "float",
        "void",
    ];

    return (
        <div className="min-h-screen bg-white py-8">
            <div className="w-full">
                <div className="card p-6 sm:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8">
                        Create New Problem
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-gray-100 border-2 border-black text-black text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Main 2 Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Column 1: All Inputs */}
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <FieldLabel
                                            htmlFor="title"
                                            required
                                            tooltip="The title of your problem. This will be displayed in problem lists and used to generate a unique URL slug. Choose a clear, descriptive title that summarizes the problem."
                                        >
                                            Title
                                        </FieldLabel>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            required
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., Two Sum"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel
                                                htmlFor="language"
                                                tooltip="Optional: Select a specific programming language to lock this problem to that language only. Leave empty to allow users to solve in any language (multi-language problem)."
                                            >
                                                Language (Optional)
                                            </FieldLabel>
                                            <select
                                                id="language"
                                                name="language"
                                                value={formData.language}
                                                onChange={handleChange}
                                                className="input-field"
                                            >
                                                <option value="">
                                                    Multi-Language (Any)
                                                </option>
                                                {languages.map((lang) => (
                                                    <option
                                                        key={lang.id}
                                                        value={lang.id}
                                                    >
                                                        {lang.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <FieldLabel
                                                htmlFor="difficulty"
                                                tooltip="The difficulty level of the problem (Easy, Medium, or Hard). This helps users filter and find problems appropriate for their skill level. Choose based on the complexity of the solution required."
                                            >
                                                Difficulty
                                            </FieldLabel>
                                            <select
                                                id="difficulty"
                                                name="difficulty"
                                                value={formData.difficulty}
                                                onChange={handleChange}
                                                className="input-field"
                                            >
                                                <option value="Easy">
                                                    Easy
                                                </option>
                                                <option value="Medium">
                                                    Medium
                                                </option>
                                                <option value="Hard">
                                                    Hard
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <FieldLabel
                                        htmlFor="description"
                                        required
                                        tooltip="A detailed description of the problem. Use Markdown formatting for better readability. Include problem statement, examples, constraints, and any additional context. This is what users will read to understand the problem."
                                    >
                                        Description (Markdown supported)
                                    </FieldLabel>
                                    <textarea
                                        id="description"
                                        name="description"
                                        required
                                        rows={8}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="input-field font-mono text-sm"
                                        placeholder="Describe the problem..."
                                    />
                                </div>

                                {/* Advanced Settings */}
                                <div className="pt-4 border-t-2 border-black">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAdvanced(!showAdvanced)
                                        }
                                        className="flex items-center justify-between w-full text-left mb-4"
                                    >
                                        <h3 className="text-lg font-medium text-black">
                                            Advanced Settings
                                        </h3>
                                        <span className="text-black text-xl">
                                            {showAdvanced ? "−" : "+"}
                                        </span>
                                    </button>
                                    {showAdvanced && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <FieldLabel
                                                    htmlFor="time_limit"
                                                    tooltip="Maximum execution time allowed for solutions in seconds. If not specified, a default limit will be used. This prevents infinite loops and ensures efficient solutions."
                                                >
                                                    Time Limit (s)
                                                </FieldLabel>
                                                <input
                                                    type="number"
                                                    id="time_limit"
                                                    name="time_limit"
                                                    step="0.1"
                                                    min="0.1"
                                                    value={
                                                        formData.time_limit ||
                                                        ""
                                                    }
                                                    onChange={handleChange}
                                                    className="input-field"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel
                                                    htmlFor="memory_limit"
                                                    tooltip="Maximum memory usage allowed for solutions in megabytes (MB). If not specified, a default limit will be used. This ensures solutions don't consume excessive system resources."
                                                >
                                                    Memory Limit (MB)
                                                </FieldLabel>
                                                <input
                                                    type="number"
                                                    id="memory_limit"
                                                    name="memory_limit"
                                                    min="1"
                                                    value={
                                                        formData.memory_limit ||
                                                        ""
                                                    }
                                                    onChange={handleChange}
                                                    className="input-field"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Function Signature */}
                                <div className="pt-4 border-t-2 border-black">
                                    <h3 className="text-lg font-medium text-black mb-4">
                                        Function Signature
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <FieldLabel
                                                    htmlFor="function_name"
                                                    required
                                                    tooltip="The name of the function that users need to implement. This is the entry point for their solution. The function name should match the language conventions (e.g., camelCase for JavaScript, snake_case for Python)."
                                                >
                                                    Entry Point Function
                                                </FieldLabel>
                                                <input
                                                    type="text"
                                                    id="function_name"
                                                    name="function_name"
                                                    required
                                                    value={
                                                        formData.function_name
                                                    }
                                                    onChange={handleChange}
                                                    className="input-field font-mono"
                                                    placeholder="e.g., twoSum"
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel
                                                    htmlFor="return_type"
                                                    required
                                                    tooltip="The data type that the function must return. Select from common types like integer, string, boolean, arrays, etc. This helps users understand what their solution should output."
                                                >
                                                    Return Type
                                                </FieldLabel>
                                                <select
                                                    id="return_type"
                                                    name="return_type"
                                                    required
                                                    value={formData.return_type}
                                                    onChange={handleChange}
                                                    className="input-field font-mono"
                                                >
                                                    {DATA_TYPES.map((type) => (
                                                        <option
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Argument Types - Only for Static/Multi-Language */}
                                        {(formData.language === "" ||
                                            languages.find(
                                                (l) =>
                                                    l.id === formData.language
                                            )?.slug === "cpp" ||
                                            languages.find(
                                                (l) =>
                                                    l.id === formData.language
                                            )?.slug === "java") && (
                                            <div>
                                                <FieldLabel tooltip="Specify the types of arguments your function expects. This is required for C++ and Java to generate the correct driver code. Add them in order.">
                                                    Argument Types
                                                </FieldLabel>
                                                <div className="space-y-2">
                                                    {formData.argument_types.map(
                                                        (type, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex gap-2"
                                                            >
                                                                <select
                                                                    value={type}
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        const newTypes =
                                                                            [
                                                                                ...formData.argument_types,
                                                                            ];
                                                                        newTypes[
                                                                            index
                                                                        ] =
                                                                            e.target.value;
                                                                        setFormData(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                argument_types:
                                                                                    newTypes,
                                                                            })
                                                                        );
                                                                    }}
                                                                    className="input-field font-mono"
                                                                >
                                                                    <option
                                                                        value=""
                                                                        disabled
                                                                    >
                                                                        Select
                                                                        Type
                                                                    </option>
                                                                    {[
                                                                        "int",
                                                                        "float",
                                                                        "string",
                                                                        "bool",
                                                                        "int[]",
                                                                        "char[]",
                                                                        "string[]",
                                                                        "vector<int>",
                                                                        "vector<string>",
                                                                    ].map(
                                                                        (t) => (
                                                                            <option
                                                                                key={
                                                                                    t
                                                                                }
                                                                                value={
                                                                                    t
                                                                                }
                                                                            >
                                                                                {
                                                                                    t
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newTypes =
                                                                            formData.argument_types.filter(
                                                                                (
                                                                                    _,
                                                                                    i
                                                                                ) =>
                                                                                    i !==
                                                                                    index
                                                                            );
                                                                        setFormData(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                argument_types:
                                                                                    newTypes,
                                                                            })
                                                                        );
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    argument_types:
                                                                        [
                                                                            ...prev.argument_types,
                                                                            "int",
                                                                        ],
                                                                })
                                                            )
                                                        }
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        + Add Argument
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t-2 border-black">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-black">
                                                Test Cases
                                            </h3>
                                            <span className="text-red-500">
                                                *
                                            </span>
                                            <div className="relative inline-block">
                                                <div
                                                    className="group relative"
                                                    onMouseEnter={(e) => {
                                                        const tooltip =
                                                            e.currentTarget.querySelector(
                                                                ".tooltip"
                                                            );
                                                        if (tooltip)
                                                            tooltip.classList.remove(
                                                                "hidden"
                                                            );
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const tooltip =
                                                            e.currentTarget.querySelector(
                                                                ".tooltip"
                                                            );
                                                        if (tooltip)
                                                            tooltip.classList.add(
                                                                "hidden"
                                                            );
                                                    }}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 text-gray-500 hover:text-black cursor-help"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <div className="tooltip hidden absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs text-black z-10 pointer-events-none">
                                                        Test cases are used to
                                                        validate user solutions.
                                                        Each test case consists
                                                        of an input and expected
                                                        output. At least one
                                                        test case is required.
                                                        The input should match
                                                        the function parameters
                                                        format, and the output
                                                        should match the return
                                                        type.
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <label
                                                    htmlFor="csv-upload"
                                                    className="text-sm text-black hover:text-gray-700 font-medium transition-colors underline cursor-pointer"
                                                    onMouseEnter={() =>
                                                        setShowCsvInstructions(
                                                            true
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setShowCsvInstructions(
                                                            false
                                                        )
                                                    }
                                                >
                                                    📁 Upload CSV
                                                </label>
                                                {showCsvInstructions && (
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-96 p-4 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs text-black z-10 pointer-events-none">
                                                        <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
                                                            📋 CSV File Format
                                                            Instructions
                                                        </div>
                                                        <div className="text-sm text-blue-800 space-y-1">
                                                            <p>
                                                                <strong>
                                                                    Structure:
                                                                </strong>{" "}
                                                                Your CSV file
                                                                must have
                                                                exactly 2
                                                                columns:
                                                            </p>
                                                            <ul className="list-disc list-inside ml-2 space-y-1">
                                                                <li>
                                                                    <strong>
                                                                        First
                                                                        row
                                                                        (header):
                                                                    </strong>{" "}
                                                                    <code className="bg-blue-100 px-1 rounded">
                                                                        input,output
                                                                    </code>
                                                                </li>
                                                                <li>
                                                                    <strong>
                                                                        Subsequent
                                                                        rows:
                                                                    </strong>{" "}
                                                                    Test case
                                                                    data
                                                                </li>
                                                            </ul>
                                                            <p className="mt-2">
                                                                <strong>
                                                                    Example CSV
                                                                    content:
                                                                </strong>
                                                            </p>
                                                            <pre className="bg-blue-100 p-2 rounded text-xs font-mono overflow-x-auto">
                                                                {`input,output
"[2,7,11,15], 9","[0,1]"
"[3,2,4], 6","[1,2]"
"[3,3], 6","[0,1]"`}
                                                            </pre>
                                                            <p className="mt-2 text-xs">
                                                                <strong>
                                                                    Note:
                                                                </strong>{" "}
                                                                If your
                                                                input/output
                                                                contains commas,
                                                                wrap them in
                                                                double quotes.
                                                                The CSV parser
                                                                will handle
                                                                quoted values
                                                                correctly.
                                                            </p>
                                                        </div>
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                id="csv-upload"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleCSVUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearAllTestCases}
                                                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors underline"
                                            >
                                                🗑️ Clear All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={addTestCase}
                                                className="text-sm text-black hover:text-gray-700 font-medium transition-colors underline"
                                            >
                                                + Add Case
                                            </button>
                                        </div>
                                    </div>

                                    {/* CSV Upload Error */}
                                    {csvUploadError && (
                                        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded">
                                            <div className="text-sm text-red-800 font-medium">
                                                ⚠️ {csvUploadError}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {formData.test_cases.map(
                                            (testCase, index) => (
                                                <div
                                                    key={index}
                                                    className="card p-4 relative group"
                                                >
                                                    {formData.test_cases
                                                        .length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTestCase(
                                                                    index
                                                                )
                                                            }
                                                            className="absolute top-2 right-2 text-gray-600 hover:text-black opacity-0 group-hover:opacity-100 transition-all border-2 border-black bg-white hover:bg-gray-100 w-6 h-6 flex items-center justify-center"
                                                            aria-label="Remove test case"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <FieldLabel
                                                                required
                                                                tooltip="The input values for this test case. Format should match the function parameters. For example, if the function takes an array and an integer, format as '[2,7,11,15], 9'. This input will be passed to the user's solution function."
                                                            >
                                                                <span className="text-xs">
                                                                    Input
                                                                </span>
                                                            </FieldLabel>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={
                                                                    testCase.input
                                                                }
                                                                onChange={(e) =>
                                                                    handleTestCaseChange(
                                                                        index,
                                                                        "input",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="input-field text-sm font-mono"
                                                                placeholder="e.g., [2,7,11,15], 9"
                                                            />
                                                        </div>
                                                        <div>
                                                            <FieldLabel
                                                                required
                                                                tooltip="The expected output for this test case. Format should match the return type. For example, if returning an array, format as '[0,1]'. The user's solution output will be compared against this value to determine if the solution is correct."
                                                            >
                                                                <span className="text-xs">
                                                                    Output
                                                                </span>
                                                            </FieldLabel>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={
                                                                    testCase.output
                                                                }
                                                                onChange={(e) =>
                                                                    handleTestCaseChange(
                                                                        index,
                                                                        "output",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="input-field text-sm font-mono"
                                                                placeholder="e.g., [0,1]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Code Editor */}
                            <div className="lg:sticky lg:top-6">
                                <FieldLabel tooltip="The initial code template that users will see when they start solving the problem. This code should include the function signature with the entry point function name, parameters, and return type. The code is automatically populated with the language's boilerplate when you select a language, but you can customize it as needed.">
                                    Starter Code
                                </FieldLabel>
                                <div
                                    className="border-2 border-black overflow-hidden"
                                    style={{
                                        height: "calc(100vh - 200px)",
                                        minHeight: "600px",
                                    }}
                                >
                                    <Editor
                                        height="100%"
                                        defaultLanguage="python"
                                        value={formData.starter_code}
                                        onChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                starter_code: value || "",
                                            }))
                                        }
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: "on",
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            tabSize: 4,
                                            wordWrap: "on",
                                            padding: { top: 16 },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div></div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Creating..." : "Create Problem"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
