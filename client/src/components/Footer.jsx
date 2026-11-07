// Footer.jsx - Global footer with project name and tagline

import React from "react";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer-brand">
          Placely<span style={{ color: "var(--cyan)" }}>.</span>
        </div>
        <p className="app-footer-tagline">
          LPU placement intelligence, interview experiences, and peer Q&A platform
        </p>
      </div>
    </footer>
  );
};

export default Footer;

