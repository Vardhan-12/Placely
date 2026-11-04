// App.jsx - Main application layout and client route definitions

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import ExperienceDetail from "./pages/ExperienceDetail";
import ExperienceForm from "./pages/ExperienceForm";
import MyPosts from "./pages/MyPosts";
import Bookmarks from "./pages/Bookmarks";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/experiences/new" element={<ExperienceForm />} />
              <Route path="/experiences/:id/edit" element={<ExperienceForm />} />
              <Route path="/experiences/:id" element={<ExperienceDetail />} />
              <Route path="/my-posts" element={<MyPosts />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

