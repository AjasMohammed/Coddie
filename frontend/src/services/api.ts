import axios from "axios";
import type {
    User,
    UserStats,
    ProblemList,
    Problem,
    Submission,
    SubmissionList,
    ProgrammingLanguage,
    AuthTokens,
    ExecutionResult,
    PaginatedResponse,
    RegisterData,
    ProblemAttempt,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (refreshToken) {
                    const response = await axios.post(
                        `${API_URL}/auth/token/refresh/`,
                        {
                            refresh: refreshToken,
                        }
                    );
                    const { access } = response.data;
                    localStorage.setItem("access_token", access);
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data: RegisterData) => api.post<User>("/auth/register/", data),

    login: (email: string, password: string) =>
        api.post<AuthTokens>("/auth/token/", { email, password }),

    refreshToken: (refresh: string) =>
        api.post<{ access: string }>("/auth/token/refresh/", { refresh }),

    me: () => api.get<UserStats>("/auth/me/"),

    updateProfile: (data: { bio?: string; avatar?: string }) =>
        api.patch("/auth/profile/", data),
};

// Problems API (with cursor pagination)
export const problemsAPI = {
    list: (params?: {
        cursor?: string;
        difficulty?: "Easy" | "Medium" | "Hard";
        search?: string;
        page_size?: number;
    }) => api.get<PaginatedResponse<ProblemList>>("/problems/", { params }),

    myProblems: (params?: {
        cursor?: string;
        difficulty?: "Easy" | "Medium" | "Hard";
        search?: string;
        is_public?: boolean;
        page_size?: number;
    }) => api.get<PaginatedResponse<ProblemList>>("/problems/my/", { params }),

    get: (slug: string) => api.get<Problem>(`/problems/${slug}/`),

    getBoilerplate: (slug: string, language: string) =>
        api.get<{ boilerplate: string }>(
            `/problems/${slug}/boilerplate/?language=${language}`
        ),

    create: (data: Partial<Problem>) =>
        api.post<Problem>("/problems/create/", data),

    update: (slug: string, data: Partial<Problem>) =>
        api.patch<Problem>(`/problems/${slug}/update/`, data),
};

// Submissions API (with cursor pagination)
export const submissionsAPI = {
    list: (params?: { cursor?: string; status?: string; problem?: string }) =>
        api.get<PaginatedResponse<SubmissionList>>("/submissions/", { params }),

    get: (id: number) => api.get<Submission>(`/submissions/${id}/`),

    create: (data: { problem: number; language: number; code: string }) =>
        api.post<Submission>("/submissions/create/", data),
};

// Languages API
export const languagesAPI = {
    list: () => api.get<ProgrammingLanguage[]>("/languages/"),
};

// Execution API
export const executionAPI = {
    run: (
        language: string,
        version: string,
        code: string,
        problem_slug: string,
        mode: "run" | "submit" = "run",
        custom_input?: string
    ) => {
        return api.post<ExecutionResult>("/execution/run/", {
            language,
            version,
            code,
            problem_slug,
            mode,
            custom_input,
        });
    },
};

// Problem Attempt API
export const attemptAPI = {
    get: (problemSlug: string, languageId: number) =>
        api.get<ProblemAttempt>(
            `/problems/${problemSlug}/attempt/?language=${languageId}`
        ),

    update: (problemSlug: string, data: { code?: string; language: number }) =>
        api.patch<ProblemAttempt>(`/problems/${problemSlug}/attempt/`, data),
};

export default api;
