import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="brand">
        <svg
          className="logo"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="8" fill="#1a1a1a" />
          <path
            d="M16 24V16M16 16V8M16 16H24M16 16H8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="brand-name">Image Meta Pro</span>
      </div>
    </header>
  );
};

export default Header;
