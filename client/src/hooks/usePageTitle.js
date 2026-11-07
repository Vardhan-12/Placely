// usePageTitle.js - Hook to set document.title per route

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLE_MAP = {
  "/": "Placely — Placement Intelligence",
  "/companies": "Companies — Placely",
  "/experiences/new": "Write Experience — Placely",
  "/my-posts": "My Posts — Placely",
  "/bookmarks": "Saved Experiences — Placely",
  "/profile": "My Profile — Placely",
  "/admin": "Admin Dashboard — Placely",
  "/login": "Log In — Placely",
  "/signup": "Sign Up — Placely",
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (TITLE_MAP[path]) {
      document.title = TITLE_MAP[path];
    } else if (path.startsWith("/companies/")) {
      document.title = "Company Details — Placely";
    } else if (path.startsWith("/experiences/")) {
      document.title = "Interview Experience — Placely";
    } else if (path.startsWith("/users/")) {
      document.title = "User Profile — Placely";
    } else {
      document.title = "Placely";
    }
  }, [location]);
};

export default usePageTitle;

