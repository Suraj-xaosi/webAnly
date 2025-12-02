"use client";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { decrement, increment } from "../store/slices/counterSlice";

export default function Color() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();
  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm text-center transform transition-transform duration-300 hover:scale-105">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">Hello Tailwind!</h1>
        <p className="text-gray-700 mb-6">
          This is a simple colorful card component built with Tailwind CSS.
        </p>
        <div className="text-2xl font-semibold text-pink-600 mb-4">Count: {count}</div>
        <button
          onClick={() => dispatch(increment())}
          className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors duration-300"
        >
          Increment
        </button>
        <button
          onClick={() => dispatch(decrement())}
          className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors duration-300"
        >
          decrement
        </button>
        
      </div>
     
    </div>

   
  );
}