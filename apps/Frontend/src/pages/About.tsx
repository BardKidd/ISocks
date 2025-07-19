import React from 'react';
import { withPageAccess } from '../components/PageAccess';

const About: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="bg-gray-700/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full border border-gray-600">
        <h1 className="text-4xl font-extrabold text-purple-400 mb-4 drop-shadow">
          About Page
        </h1>
        <p className="text-gray-100 text-lg text-center">
          This is the about page.
        </p>
      </div>
    </div>
  );
};

const WrappedAbout = withPageAccess('B01')(About);
export default WrappedAbout;