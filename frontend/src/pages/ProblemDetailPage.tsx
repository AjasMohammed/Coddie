import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { problemsAPI, attemptAPI, languagesAPI } from "../services/api";
import type { Problem, ExecutionResult, ProgrammingLanguage } from "../types";
import { formatInputArray, formatOutputValue } from "../utils/testCaseParser";
import { TestResultDisplay } from "../components/TestResultDisplay";
import { useAuth } from "../context/AuthContext";

export const ProblemDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const { isAuthenticated } = useAuth();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
    const [selectedLanguage, setSelectedLanguage] =
        useState<ProgrammingLanguage | null>(null);
    const [code, setCode] = useState("");
    const [output, setOutput] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(
        null
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [submissionId, setSubmissionId] = useState<number | null>(null); // Can be used to link to submission details

    // WebSocket URL - backend runs on port 8080
    // Ensure we have a valid WebSocket URL
    const getWebSocketUrl = () => {
        const envUrl = import.meta.env.VITE_WS_URL;
        const defaultUrl = "ws://localhost:8080/ws";
        const url = envUrl || defaultUrl;

        // Validate URL
        if (
            !url ||
            url.trim() === "" ||
            (!url.startsWith("ws://") && !url.startsWith("wss://"))
        ) {
            console.error(
                "Invalid WebSocket URL:",
                url,
                "Using default:",
                defaultUrl
            );
            return defaultUrl;
        }

        return url.endsWith("/") ? url : `${url}/`;
    };

    const WS_URL = getWebSocketUrl();
    const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Handle WebSocket messages
    const handleWebSocketMessage = useCallback(
        (message: any) => {
            if (message.error) {
                console.error("WebSocket error:", message.error);
                setOutput({
                    language: problem?.language?.slug || "",
                    version: "*",
                    run: {
                        stdout: "",
                        stderr: message.error,
                        code: 1,
                        signal: null,
                        output: "",
                    },
                });
                setExecuting(false);
                setSubmitting(false);
                return;
            }

            if (message.result) {
                // Convert WebSocket result to ExecutionResult format
                const executionResult: ExecutionResult = {
                    language: problem?.language?.slug || "",
                    version: "*",
                    run: message.result.run,
                    compile: message.result.compile,
                };
                setOutput(executionResult);

                // Handle submission status
                if (message.mode === "submit") {
                    setSubmissionStatus(message.status || null);
                    setSubmissionId(message.submission_id || null);
                }
            }

            setExecuting(false);
            setSubmitting(false);
        },
        [problem]
    );

    // Initialize WebSocket connection when needed
    const initializeWebSocket = useCallback(() => {
        if (wsConnection?.readyState === WebSocket.OPEN) {
            console.log("Reusing existing WebSocket connection");
            return wsConnection;
        }

        if (!isAuthenticated || !problem) {
            console.warn(
                "Cannot initialize WebSocket: not authenticated or problem not loaded"
            );
            return null;
        }

        // Ensure WS_URL is valid
        if (!WS_URL || WS_URL.trim() === "") {
            console.error("WebSocket URL is empty or invalid:", WS_URL);
            return null;
        }

        const token = localStorage.getItem("access_token");
        // Remove trailing slash if present, then add it back to ensure consistency
        const cleanUrl = WS_URL.replace(/\/$/, "");
        const wsUrl = token
            ? `${cleanUrl}/execute/?token=${encodeURIComponent(token)}`
            : cleanUrl;

        console.log("Initializing WebSocket connection to:", wsUrl);
        console.log("Base WS_URL:", WS_URL);
        console.log("Token present:", !!token);

        if (!wsUrl || wsUrl === "ws:///" || wsUrl === "wss:///") {
            console.error("Invalid WebSocket URL constructed:", wsUrl);
            return null;
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            console.error("WebSocket URL was:", wsUrl);
            setIsConnected(false);
        };

        ws.onclose = (event) => {
            console.log("WebSocket disconnected", event.code, event.reason);
            setIsConnected(false);
            setWsConnection(null);
        };

        setWsConnection(ws);
        return ws;
    }, [isAuthenticated, problem, WS_URL, handleWebSocketMessage]);

    // Ref for debounce timer
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Ref to track if code has been initialized from attempt
    const codeInitializedRef = useRef(false);
    // Ref to track current code for saving on unmount
    const currentCodeRef = useRef("");
    // Ref to track current problem for saving on unmount
    const currentProblemRef = useRef<Problem | null>(null);

    // Auto-save function
    const saveAttempt = async (codeToSave: string, silent = false) => {
        if (!isAuthenticated || !problem || !slug || !selectedLanguage) return;

        try {
            if (!silent) {
                setSaving(true);
            }
            await attemptAPI.update(slug, {
                code: codeToSave,
                language: selectedLanguage.id,
            });
            setSavedAt(new Date());
        } catch (error) {
            console.error("Failed to save attempt:", error);
        } finally {
            if (!silent) {
                setSaving(false);
            }
        }
    };

    // Debounced auto-save
    const handleCodeChange = (value: string | undefined) => {
        const newCode = value || "";
        setCode(newCode);
        currentCodeRef.current = newCode; // Keep ref updated

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Only auto-save if user is authenticated and code has been initialized
        if (isAuthenticated && codeInitializedRef.current) {
            // Set new timeout for auto-save (2 seconds after last change)
            saveTimeoutRef.current = setTimeout(() => {
                saveAttempt(newCode);
            }, 2000);
        }
    };

    // Update problem ref whenever problem state changes
    useEffect(() => {
        currentProblemRef.current = problem;
    }, [problem]);

    useEffect(() => {
        // Reset initialization flag when slug changes
        codeInitializedRef.current = false;
        currentCodeRef.current = "";
        currentProblemRef.current = null;

        const fetchData = async () => {
            try {
                // Fetch languages first
                const languagesRes = await languagesAPI.list();
                setLanguages(languagesRes.data);

                const problemRes = await problemsAPI.get(slug!);
                const problemData = problemRes.data;
                setProblem(problemData);
                currentProblemRef.current = problemData;

                // Determine selected language
                let initialLanguage: ProgrammingLanguage | null = null;
                if (problemData.language) {
                    // Single-language problem - lock to that language
                    initialLanguage = problemData.language;
                } else {
                    // Multi-language problem - use first language as default
                    initialLanguage = languagesRes.data[0] || null;
                }
                setSelectedLanguage(initialLanguage);

                // Try to load saved attempt if user is authenticated
                if (isAuthenticated) {
                    try {
                        const attemptRes = await attemptAPI.get(
                            slug!,
                            initialLanguage.id
                        );
                        const attempt = attemptRes.data;

                        // If attempt has a language saved, use that for multi-language problems
                        if (!problemData.language && attempt.language) {
                            const savedLang = languagesRes.data.find(
                                (l) => l.id === attempt.language
                            );
                            if (savedLang) {
                                initialLanguage = savedLang;
                                setSelectedLanguage(savedLang);
                            }
                        }

                        // Use saved code if available and not empty
                        if (attempt.code && attempt.code.trim()) {
                            setCode(attempt.code);
                            currentCodeRef.current = attempt.code;
                        } else if (initialLanguage) {
                            // Fetch dynamic boilerplate
                            try {
                                const boilerplateRes =
                                    await problemsAPI.getBoilerplate(
                                        slug!,
                                        initialLanguage.slug
                                    );
                                const initialCode =
                                    boilerplateRes.data.boilerplate;
                                setCode(initialCode);
                                currentCodeRef.current = initialCode;
                            } catch (error) {
                                console.error(
                                    "Failed to fetch boilerplate:",
                                    error
                                );
                                const initialCode =
                                    initialLanguage.boilerplate || "";
                                setCode(initialCode);
                                currentCodeRef.current = initialCode;
                            }
                        }
                        codeInitializedRef.current = true;
                    } catch (error) {
                        // If attempt doesn't exist or error, fetch dynamic boilerplate
                        console.error("Failed to load attempt:", error);
                        if (initialLanguage) {
                            try {
                                const boilerplateRes =
                                    await problemsAPI.getBoilerplate(
                                        slug!,
                                        initialLanguage.slug
                                    );
                                const initialCode =
                                    boilerplateRes.data.boilerplate;
                                setCode(initialCode);
                                currentCodeRef.current = initialCode;
                            } catch (boilerplateError) {
                                console.error(
                                    "Failed to fetch boilerplate:",
                                    boilerplateError
                                );
                                const initialCode =
                                    initialLanguage.boilerplate || "";
                                setCode(initialCode);
                                currentCodeRef.current = initialCode;
                            }
                        }
                        codeInitializedRef.current = true;
                    }
                } else {
                    // Not authenticated, fetch dynamic boilerplate
                    if (initialLanguage) {
                        try {
                            const boilerplateRes =
                                await problemsAPI.getBoilerplate(
                                    slug!,
                                    initialLanguage.slug
                                );
                            const initialCode = boilerplateRes.data.boilerplate;
                            setCode(initialCode);
                            currentCodeRef.current = initialCode;
                        } catch (error) {
                            console.error(
                                "Failed to fetch boilerplate:",
                                error
                            );
                            const initialCode =
                                initialLanguage.boilerplate || "";
                            setCode(initialCode);
                            currentCodeRef.current = initialCode;
                        }
                    }
                    codeInitializedRef.current = true;
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Save code before navigating away
        const handleBeforeUnload = () => {
            if (
                isAuthenticated &&
                codeInitializedRef.current &&
                currentCodeRef.current
            ) {
                // Use sendBeacon or sync fetch for reliable save on navigation
                // For now, we'll use a sync approach with a flag
                // Note: Modern browsers limit what we can do in beforeunload
                // So we'll rely on the debounced save + immediate save on run
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup timeout and save pending changes on unmount
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);

            // Save any pending changes before unmounting
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }

            // Save immediately if there are unsaved changes
            // We use the refs and current values to avoid stale closures
            const codeToSave = currentCodeRef.current;
            const currentProblem = currentProblemRef.current;
            const shouldSave =
                isAuthenticated &&
                codeInitializedRef.current &&
                codeToSave &&
                slug &&
                currentProblem;

            if (shouldSave) {
                // Save using the refs to avoid stale closures
                attemptAPI
                    .update(slug, {
                        code: codeToSave,
                        language: currentProblem.language?.id || undefined,
                    })
                    .catch(console.error);
            }
        };
    }, [slug, isAuthenticated]);

    // Handle language change for multi-language problems
    const handleLanguageChange = async (languageId: number) => {
        const newLanguage = languages.find((l) => l.id === languageId);
        if (!newLanguage || !slug) return;

        // Step 1: Save current code for current language (if authenticated and has code)
        if (isAuthenticated && selectedLanguage && code.trim()) {
            try {
                await attemptAPI.update(slug, {
                    code: code,
                    language: selectedLanguage.id,
                });
            } catch (error) {
                console.error("Failed to save current code:", error);
            }
        }

        // Step 2: Update selected language
        setSelectedLanguage(newLanguage);

        // Step 3: Try to load saved code for new language
        if (isAuthenticated) {
            try {
                const attemptRes = await attemptAPI.get(slug, newLanguage.id);
                const savedCode = attemptRes.data.code;

                if (savedCode && savedCode.trim()) {
                    // Use saved code
                    setCode(savedCode);
                    currentCodeRef.current = savedCode;
                } else {
                    // No saved code, fetch boilerplate
                    const boilerplateRes = await problemsAPI.getBoilerplate(
                        slug,
                        newLanguage.slug
                    );
                    const newCode = boilerplateRes.data.boilerplate;
                    setCode(newCode);
                    currentCodeRef.current = newCode;
                }
            } catch (error) {
                console.error("Failed to load saved code:", error);
                // Fallback to boilerplate
                try {
                    const boilerplateRes = await problemsAPI.getBoilerplate(
                        slug,
                        newLanguage.slug
                    );
                    const newCode = boilerplateRes.data.boilerplate;
                    setCode(newCode);
                    currentCodeRef.current = newCode;
                } catch (boilerplateError) {
                    console.error(
                        "Failed to fetch boilerplate:",
                        boilerplateError
                    );
                    const newCode = newLanguage.boilerplate || "";
                    setCode(newCode);
                    currentCodeRef.current = newCode;
                }
            }
        } else {
            // Not authenticated, just show boilerplate
            try {
                const boilerplateRes = await problemsAPI.getBoilerplate(
                    slug,
                    newLanguage.slug
                );
                const newCode = boilerplateRes.data.boilerplate;
                setCode(newCode);
                currentCodeRef.current = newCode;
            } catch (error) {
                console.error("Failed to fetch boilerplate:", error);
                const newCode = newLanguage.boilerplate || "";
                setCode(newCode);
                currentCodeRef.current = newCode;
            }
        }
    };

    const handleRunCode = async () => {
        if (!selectedLanguage || !problem) {
            console.error("Cannot run code: missing problem/language");
            return;
        }

        // Save code immediately before running (clear any pending debounce)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Save current code immediately
        if (isAuthenticated && codeInitializedRef.current) {
            await saveAttempt(code, true); // Silent save to avoid UI flicker
        }

        setExecuting(true);
        setOutput(null);
        setSubmissionStatus(null);
        setSubmissionId(null);

        // Initialize WebSocket if not connected
        const ws = initializeWebSocket();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected, waiting for connection...");
            // Wait a bit for connection
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (ws?.readyState !== WebSocket.OPEN) {
                setOutput({
                    language: selectedLanguage.slug,
                    version: "*",
                    run: {
                        stdout: "",
                        stderr: "Failed to connect to execution service. Please try again.",
                        code: 1,
                        signal: null,
                        output: "",
                    },
                });
                setExecuting(false);
                return;
            }
        }

        // Send execution request via WebSocket
        try {
            ws.send(
                JSON.stringify({
                    language: selectedLanguage.slug,
                    version: "*",
                    code: code,
                    problem_slug: problem.slug,
                    mode: "run",
                })
            );
        } catch (error) {
            console.error("Failed to send WebSocket message:", error);
            setOutput({
                language: selectedLanguage.slug,
                version: "*",
                run: {
                    stdout: "",
                    stderr: "Failed to send execution request",
                    code: 1,
                    signal: null,
                    output: "",
                },
            });
            setExecuting(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!selectedLanguage || !problem) {
            console.error("Cannot submit code: missing problem/language");
            return;
        }

        if (!isAuthenticated) {
            alert("Please log in to submit your code");
            return;
        }

        // Save code immediately before submitting
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Save current code immediately
        if (codeInitializedRef.current) {
            await saveAttempt(code, true);
        }

        setSubmitting(true);
        setOutput(null);
        setSubmissionStatus(null);
        setSubmissionId(null);

        // Initialize WebSocket if not connected
        const ws = initializeWebSocket();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected, waiting for connection...");
            // Wait a bit for connection
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (ws?.readyState !== WebSocket.OPEN) {
                setOutput({
                    language: selectedLanguage.slug,
                    version: "*",
                    run: {
                        stdout: "",
                        stderr: "Failed to connect to execution service. Please try again.",
                        code: 1,
                        signal: null,
                        output: "",
                    },
                });
                setSubmitting(false);
                return;
            }
        }

        // Send submission request via WebSocket
        try {
            ws.send(
                JSON.stringify({
                    language: selectedLanguage.slug,
                    version: "*",
                    code: code,
                    problem_slug: problem.slug,
                    mode: "submit",
                })
            );
        } catch (error) {
            console.error("Failed to send WebSocket message:", error);
            setOutput({
                language: selectedLanguage.slug,
                version: "*",
                run: {
                    stdout: "",
                    stderr: "Failed to send submission request",
                    code: 1,
                    signal: null,
                    output: "",
                },
            });
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-black text-xl">Loading...</div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-black text-xl">Problem not found</div>
            </div>
        );
    }

    return (
        <div className="lg:h-[calc(100vh-4rem)] w-full -mx-4 sm:-mx-6 lg:-mx-8 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 animate-fade-in flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Panel - Problem Description */}
            <div className="lg:w-1/2 h-[600px] lg:h-full flex flex-col card overflow-hidden">
                <div className="p-4 sm:p-6 border-b-2 border-black bg-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-3 sm:mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                            {problem.title}
                        </h1>
                        <span
                            className={`px-3 py-1 text-xs font-medium border-2 border-black w-fit ${
                                problem.difficulty === "Easy"
                                    ? "bg-gray-200 text-black"
                                    : problem.difficulty === "Medium"
                                    ? "bg-gray-400 text-black"
                                    : "bg-black text-white"
                            }`}
                        >
                            {problem.difficulty}
                        </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2">
                        <span>By {problem.created_by}</span>
                        <span>•</span>
                        <span>Acceptance: --</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6 sm:space-y-8 bg-white">
                    <div className="prose max-w-none">
                        <p className="text-black leading-relaxed text-sm sm:text-base lg:text-lg">
                            {problem.description}
                        </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                            <span className="w-1 h-5 sm:h-6 bg-black"></span>
                            Constraints
                        </h3>
                        <div className="bg-gray-100 p-3 sm:p-4 border-2 border-black font-mono text-xs sm:text-sm text-black">
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2">
                                <li>Time Limit: {problem.time_limit}ms</li>
                                <li>Memory Limit: {problem.memory_limit}MB</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                            <span className="w-1 h-5 sm:h-6 bg-black"></span>
                            Example Test Cases
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                            {problem.test_cases &&
                                problem.test_cases.length > 0 &&
                                problem.test_cases.map((testCase, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-100 p-3 sm:p-4 border-2 border-black hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 sm:mb-3">
                                            Example {index + 1}
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div>
                                                <span className="text-gray-600 text-xs sm:text-sm block mb-1">
                                                    Input:
                                                </span>
                                                <code className="block bg-white p-2 sm:p-2.5 border-2 border-black text-black font-mono text-xs sm:text-sm break-all">
                                                    {formatInputArray(
                                                        testCase.input
                                                    )}
                                                </code>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 text-xs sm:text-sm block mb-1">
                                                    Output:
                                                </span>
                                                <code className="block bg-white p-2 sm:p-2.5 border-2 border-black text-black font-mono text-xs sm:text-sm break-all">
                                                    {formatOutputValue(
                                                        testCase.output
                                                    )}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Code Editor */}
            <div className="lg:w-1/2 h-[600px] lg:h-full flex flex-col gap-3 sm:gap-4">
                <div className="flex-1 card overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-100 border-b-2 border-black">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Language Selector - Disabled for single-language problems */}
                            {problem.language ? (
                                // Single-language problem - show locked language
                                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white border-2 border-black">
                                    <span className="w-2 h-2 border-2 border-black bg-gray-300"></span>
                                    <span className="text-xs sm:text-sm text-black font-medium">
                                        {problem.language.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        (Locked)
                                    </span>
                                </div>
                            ) : (
                                // Multi-language problem - show selector
                                <select
                                    value={selectedLanguage?.id || ""}
                                    onChange={(e) =>
                                        handleLanguageChange(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="px-2.5 sm:px-3 py-1.5 bg-white border-2 border-black text-xs sm:text-sm text-black font-medium cursor-pointer hover:bg-gray-50"
                                >
                                    {languages.map((lang) => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {isAuthenticated && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    {saving ? (
                                        <>
                                            <svg
                                                className="animate-spin h-3 w-3"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span>Saving...</span>
                                        </>
                                    ) : savedAt ? (
                                        <span className="text-green-600">
                                            Saved {savedAt.toLocaleTimeString()}
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRunCode}
                                disabled={
                                    executing || submitting || !selectedLanguage
                                }
                                className="btn-primary flex items-center gap-2 py-1.5 px-3 sm:px-4 text-xs sm:text-sm touch-target"
                            >
                                {executing ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span>Running...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>Run Code</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleSubmitCode}
                                disabled={
                                    executing ||
                                    submitting ||
                                    !selectedLanguage ||
                                    !isAuthenticated
                                }
                                className="btn-primary flex items-center gap-2 py-1.5 px-3 sm:px-4 text-xs sm:text-sm touch-target bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {submitting ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span>Submit</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative bg-dark-950">
                        <Editor
                            height="100%"
                            language={
                                selectedLanguage?.slug === "cpp"
                                    ? "cpp"
                                    : selectedLanguage?.slug || "plaintext"
                            }
                            theme="vs-dark"
                            value={code}
                            onChange={handleCodeChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'Fira Code', monospace",
                                lineNumbers: "on",
                                roundedSelection: false,
                                scrollBeyondLastLine: false,
                                readOnly: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                cursorBlinking: "smooth",
                                cursorSmoothCaretAnimation: "on",
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                </div>

                {/* Output Panel */}
                <div className="h-[200px] lg:h-1/3 card overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-b-2 border-black">
                        <h3 className="font-medium text-black flex items-center gap-2 text-sm sm:text-base">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            Console Output
                        </h3>
                        <div className="flex items-center gap-2">
                            {submissionStatus && (
                                <span
                                    className={`text-xs px-2 py-1 border-2 border-black whitespace-nowrap ${
                                        submissionStatus === "Accepted"
                                            ? "bg-green-500 text-white"
                                            : submissionStatus ===
                                              "Wrong Answer"
                                            ? "bg-red-500 text-white"
                                            : submissionStatus ===
                                              "Runtime Error"
                                            ? "bg-orange-500 text-white"
                                            : submissionStatus ===
                                              "Compilation Error"
                                            ? "bg-red-600 text-white"
                                            : "bg-gray-500 text-white"
                                    }`}
                                >
                                    {submissionStatus}
                                </span>
                            )}
                            {output && (
                                <span
                                    className={`text-xs px-2 py-1 border-2 border-black whitespace-nowrap ${
                                        output.run?.code === 0
                                            ? "bg-gray-200 text-black"
                                            : "bg-black text-white"
                                    }`}
                                >
                                    Exit Code: {output.run?.code}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-y-auto custom-scrollbar border-2 border-t-0 border-black">
                        {output ? (
                            <div className="space-y-3">
                                {output.compile && output.compile.stderr && (
                                    <div className="text-black bg-red-50 p-4 border-2 border-red-500 rounded-lg">
                                        <div className="font-bold mb-2 flex items-center gap-2 text-red-700">
                                            <span>⚠</span>
                                            <span>Compilation Error</span>
                                        </div>
                                        <div className="whitespace-pre-wrap bg-white p-3 border-2 border-black rounded font-mono text-sm">
                                            {output.compile.stderr}
                                        </div>
                                    </div>
                                )}
                                {output.run?.stdout && (
                                    <div className="text-black">
                                        {/* Check if stdout is a JSON error message */}
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(
                                                    output.run.stdout.trim()
                                                );
                                                if (
                                                    parsed.status &&
                                                    parsed.status !== "Accepted"
                                                ) {
                                                    return (
                                                        <TestResultDisplay
                                                            output={
                                                                output.run
                                                                    .stdout
                                                            }
                                                        />
                                                    );
                                                }
                                            } catch {
                                                // Not JSON, show as regular output
                                            }
                                            return (
                                                <>
                                                    <div className="text-gray-600 text-xs mb-2 uppercase tracking-wider font-semibold">
                                                        Standard Output
                                                    </div>
                                                    <div className="whitespace-pre-wrap bg-gray-50 p-3 border-2 border-black rounded">
                                                        {output.run.stdout}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                                {output.run?.stderr && (
                                    <div className="text-black">
                                        <div className="text-gray-600 text-xs mb-2 uppercase tracking-wider font-semibold">
                                            Standard Error
                                        </div>
                                        <div className="whitespace-pre-wrap bg-red-50 p-3 border-2 border-red-500 rounded">
                                            {output.run.stderr}
                                        </div>
                                    </div>
                                )}
                                {output.run?.code === 0 &&
                                    output.run?.stdout &&
                                    (() => {
                                        try {
                                            const parsed = JSON.parse(
                                                output.run.stdout.trim()
                                            );
                                            if (parsed.status === "Accepted") {
                                                return (
                                                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 text-green-700 font-bold">
                                                            <span className="text-xl">
                                                                ✓
                                                            </span>
                                                            <span>
                                                                All test cases
                                                                passed!
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch {
                                            // Not JSON
                                        }
                                        return null;
                                    })()}
                                {!output.run?.stdout &&
                                    !output.run?.stderr &&
                                    !output.compile?.stderr && (
                                        <div className="text-gray-600 italic text-center py-8">
                                            Program executed successfully with
                                            no output.
                                        </div>
                                    )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                                <svg
                                    className="w-12 h-12 opacity-20"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p>Run your code to see the output here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
