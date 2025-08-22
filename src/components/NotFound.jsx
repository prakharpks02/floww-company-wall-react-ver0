import React from 'react';


import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 px-4 py-12">
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full">
      {/* SVG Illustration */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
        <circle cx="60" cy="60" r="60" fill="#E9D5FF" />
        <ellipse cx="60" cy="90" rx="32" ry="8" fill="#C7D2FE" />
        <rect x="35" y="40" width="50" height="30" rx="8" fill="#A5B4FC" />
        <rect x="50" y="55" width="20" height="5" rx="2.5" fill="#6366F1" />
        <circle cx="50" cy="52" r="2" fill="#6366F1" />
        <circle cx="70" cy="52" r="2" fill="#6366F1" />
      </svg>
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2 drop-shadow-lg">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-6">Sorry, the page you are looking for does not exist or has been moved.</p>
      <Link
        to="/employee/dashboard"
        className="inline-block px-6 py-3 rounded-lg bg-[#9F7AEA] text-white font-semibold shadow-lg hover:bg-[#7C5CD6] focus:bg-[#7C5CD6] transition-all duration-200"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
