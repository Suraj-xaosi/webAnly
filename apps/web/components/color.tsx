export default function Color() {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm text-center transform transition-transform duration-300 hover:scale-105">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">Hello Tailwind!</h1>
        <p className="text-gray-700 mb-6">
          This is a simple colorful card component built with Tailwind CSS.
        </p>
        <button className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200">
          Click Me
        </button>
      </div>
    </div>

   
  );
}