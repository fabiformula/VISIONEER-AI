import React from 'react';

const VisionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md w-full p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <VisionIcon />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Visioneer AI
          </h1>
        </div>
        <div className="text-sm text-gray-600 font-medium hidden sm:block">
          Rediseña Cualquier Espacio
        </div>
      </div>
    </header>
  );
};

export default Header;