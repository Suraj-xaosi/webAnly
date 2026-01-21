"use client";
import SidebarButton from "../../../appComponents/buttons/sidebarButton";
import { useAppSelector } from "../../../../store/hooks";

export default function SiteList() {
  const sites = useAppSelector((s) => s.site.sites);
  function SitesList() {
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
              </li>
            ))}
          </ul>
        ) : (
          <p>No sites available</p>
        )}
      </div>
    );
  }
  return (
    <SidebarButton label={<>Your domains</>}>
      <h2 className="text-xl font-semibold text-purple-300 mb-4">Your Domains</h2>
      <SitesList />
    </SidebarButton>
  );
}