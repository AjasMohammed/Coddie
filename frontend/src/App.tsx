import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProblemsPage } from "./pages/ProblemsPage";
import { ProblemDetailPage } from "./pages/ProblemDetailPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateProblemPage } from "./pages/CreateProblemPage";
import { MyProblemsPage } from "./pages/MyProblemsPage";
import { EditProblemPage } from "./pages/EditProblemPage";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen bg-white text-black">
                    <Navbar />
                    <main className="flex w-full flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/problems"
                                element={
                                    <ProtectedRoute>
                                        <ProblemsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/problems/create"
                                element={
                                    <ProtectedRoute>
                                        <CreateProblemPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/problems/my"
                                element={
                                    <ProtectedRoute>
                                        <MyProblemsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/problems/:slug/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditProblemPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/problems/:slug"
                                element={
                                    <ProtectedRoute>
                                        <ProblemDetailPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/submissions"
                                element={
                                    <ProtectedRoute>
                                        <SubmissionsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
