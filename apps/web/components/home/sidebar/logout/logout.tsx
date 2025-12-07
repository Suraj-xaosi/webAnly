"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function Logout() {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Logout Trigger (div role="button") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" ? setOpen(true) : null)}
        
      >
        🚪  Logout
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  p-6 backdrop-blur-sm">
          <div className="bg-[#8B5CF6] backdrop-blur-xl p-6 w-[320px] rounded-2xl shadow-2xl animate-pop border border-purple-200">

            <p className="font-extrabold text-white mb-6 text-center drop-shadow">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl bg-[#6F42C1] text-white font-semibold "
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-[#6F42C1] text-white font-semibold animate-bounce "
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop animation */}
      <style jsx>{`
        .animate-pop {
          animation: pop 0.25s ease-out;
        }

        @keyframes pop {
          from {
            transform: scale(0.85);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
