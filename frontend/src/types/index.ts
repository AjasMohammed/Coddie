// User types
export interface User {
    id: number;
    username: string;
    email: string;
    date_joined?: string;
}

export interface Profile {
    bio: string;
    avatar: string;
    score: number;
    created_at: string;
    updated_at: string;
}

export interface UserWithProfile extends User {
    profile: Profile;
}

export interface UserStats extends UserWithProfile {
    total_submissions: number;
    accepted_submissions: number;
    pending_submissions: number;
}

// Programming Language
export interface ProgrammingLanguage {
    id: number;
    name: string;
    slug: string;
    boilerplate: string;
}

// Problem types
export interface ProblemList {
    id: number;
    title: string;
    slug: string;
    difficulty: "Easy" | "Medium" | "Hard";
    created_by: string;
    is_public?: boolean;
    created_at: string;
}

export interface Problem extends ProblemList {
    description: string;
    time_limit: number;
    memory_limit: number;
    test_cases: TestCase[];
    function_name: string;
    return_type: string;
    language: ProgrammingLanguage | null;
    starter_code?: string;
    is_public: boolean;
    updated_at: string;
}

export interface TestCase {
    input: any[]; // Array of input arguments, e.g., [[2,7,11,15], 9]
    output: any; // Output value, can be array, number, string, etc., e.g., [0,1]
}

// Submission types
export interface SubmissionList {
    id: number;
    problem_title: string;
    problem_slug: string;
    user_name: string;
    language_name: string;
    status: SubmissionStatus;
    execution_time: number | null;
    memory_usage: number | null;
    created_at: string;
}

export interface Submission extends SubmissionList {
    problem: number;
    language: number;
    code: string;
    output: string | null;
}

export type SubmissionStatus =
    | "Pending"
    | "Accepted"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Runtime Error"
    | "Compilation Error";

// Auth types
export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

// API Response types
export interface PaginatedResponse<T> {
    results: T[];
    next: string | null;
    page_size: number;
}

export interface APIError {
    error: string;
    details?: Record<string, string[]>;
}

// Execution types
export interface ExecutionResult {
    run?: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
    compile?: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
    language: string;
    version: string;
}

// Problem Attempt types
export interface ProblemAttempt {
    id: number;
    problem: number;
    problem_slug: string;
    language: number | null;
    language_name: string | null;
    code: string;
    created_at: string;
    updated_at: string;
}

// WebSocket message types
export interface WebSocketMessage {
    type: "execution_update" | "submission_update" | "error";
    data: any;
}
