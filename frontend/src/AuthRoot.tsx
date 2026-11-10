import App from "./App.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { useAuth } from "./context/AuthContext.tsx";

export default function AuthRoot() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <LoginPage />;
    return <App />;
}
