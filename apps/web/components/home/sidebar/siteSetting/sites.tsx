"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { removeSite } from "../../../../lib/sActions/removeSite"; 
import { fetchSiteInfo } from "../../../../store/slices/sitesSlice";

export default function Sites() {
  const sites = useAppSelector((s) => s.site.sites);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (site: any) => {
    setSelectedSite(site);
    setOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSite) return;
    setDeleting(true);

    try {
      await removeSite(selectedSite.id);

      alert("Site removed successfully!");
      setOpen(false);
      setSelectedSite(null);
      dispatch(fetchSiteInfo());
    } catch (err) {
      alert("Failed to delete site.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 relative">
      {sites && sites.length > 0 ? (
        <ul className="space-y-3 ">
          {sites.map((site) => (
            <li
              key={site.id}
              className="flex items-center justify-between bg-[#6F42C1] text-white font-semibold p-3 rounded-xl"
            >
              <span className="w-full py-3 rounded-xl bg-[#6F42C1] text-white font-semibold">{site.domain}</span>

              <div
                role="button"
                onClick={() => handleDeleteClick(site)}
                className=" font-semibold p-3 bg-[#8B5CF6] font-semibold cursor-pointer hover:bg-red-600 rounded-lg transition-colors"
              >
                🗑 
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No sites available</p>
      )}

      {/* 🔥 Confirmation Popup */}
      {open && selectedSite && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white w-80 p-5 rounded-xl shadow-xl space-y-3 animate-fadeIn">
            <h3 className="font-bold text-lg">Remove Domain?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{selectedSite.domain}</span>?
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setOpen(false);
                  setSelectedSite(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * 🔥
 */