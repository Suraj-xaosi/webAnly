"use client";


import SidebarButton from "../../../appComponents/buttons/sidebarButton";
import { useAppSelector,useAppDispatch } from "../../../../store/hooks";
import ShowScript from "./showScript";
import { removeSite } from "../../../../lib/sActions/removeSite";
import { fetchSiteInfo } from "../../../../store/slices/sitesSlice";



export default function SiteList() {

  const sites = useAppSelector((s) => s.site.sites);
  const dispatch = useAppDispatch();
  async function handleRemoveSite(siteId: string) {
    await removeSite(siteId);
    dispatch(fetchSiteInfo());
  }
  function SitesList() {


    return (

      <div className="p-4 relative">
        {sites && sites.length > 0 ? (
          <ul className="space-y-3 ">
            {sites.map((site:{id:string,domain:string}) => (
              <li
                key={site.id}
                className="flex items-center justify-between bg-[#6F42C1] text-white font-semibold p-3 rounded-xl"
              >
                <span className="w-full py-3 rounded-xl bg-[#6F42C1] text-white font-semibold">{site.domain}</span>

                <SidebarButton label={<>Show Script</>} >
                  <ShowScript site={site}/>
                </SidebarButton>

                <button 
                  onClick={() => handleRemoveSite(site.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (<p className="text-red-500">No sites available</p>)
        }
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