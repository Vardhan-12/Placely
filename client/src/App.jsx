// App.jsx - Main application layout and client route definitions

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Route error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "48px 16px", textAlign: "center" }}>
          <div className="card" style={{ maxWidth: 480, margin: "0 auto", padding: "32px" }}>
            <h2 style={{ marginBottom: 12 }}>Something went wrong</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>
              An unexpected error occurred. Please try again.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import usePageTitle from "./hooks/usePageTitle";
import Home from "./pages/Home";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import ExperienceDetail from "./pages/ExperienceDetail";
import ExperienceForm from "./pages/ExperienceForm";
import MyPosts from "./pages/MyPosts";
import Bookmarks from "./pages/Bookmarks";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

function AppContent() {
  usePageTitle();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/experiences/new" element={<ExperienceForm />} />
          <Route path="/experiences/:id/edit" element={<ExperienceForm />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

