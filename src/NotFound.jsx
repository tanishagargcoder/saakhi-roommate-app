import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-[#283593] via-[#3949ab] to-[#5c6bc0] text-white">
    <div className="text-7xl mb-4">🏠</div>
    <h1 className="text-5xl font-bold mb-3">404</h1>
    <p className="text-xl text-[#e8eaf6] mb-8 max-w-md">
      Oops! This room doesn't exist. Let's get you back home.
    </p>
    <Link to="/" className="sakhi-button-primary px-8 py-3 text-lg">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
