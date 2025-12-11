"use client";

import { useState } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import { fetchSiteInfo } from "../../../../store/slices/sitesSlice";
import { addingSite } from "../../../../lib/sActions/addingSite"; 

export default function AddSite() {
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();

  const handleAddSite = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await addingSite(site);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    dispatch(fetchSiteInfo());
    alert("Site added!");
    setOpen(false);
    setSite("");
    setLoading(false);
  };

  return (
    <>
      {/* Trigger button */}
      <div
        role="button"
        tabIndex={0}
        
        onClick={() => setOpen(true)}
      >
        ➕ Add domain
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#2a2140] p-6 rounded-2xl w-[90%] max-w-md shadow-xl border border-purple-500/20">
            <h2 className="text-xl font-semibold text-purple-300 mb-4">
              Add a new domain
            </h2>

            <form onSubmit={handleAddSite} className="space-y-4">
              <input
                disabled={loading}
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="example.com"
                className="w-full rounded-xl px-4 py-3 bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400 transition"
              />

              {error && (
                <p className="text-red-300 text-sm bg-red-500/10 p-2 rounded">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white font-semibold shadow-lg disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add domain"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="w-full py-2 rounded-xl bg-white/10 text-purple-200 hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
