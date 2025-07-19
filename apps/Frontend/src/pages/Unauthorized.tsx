const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-red-400 mb-4 drop-shadow">
          Unauthorized
        </h1>
        <p className="text-gray-200 text-lg mb-8 text-center">
          You do not have permission to access this page.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default Unauthorized;
