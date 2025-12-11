import { useState } from "react";
import Sites from "./sites";

export default function Domain() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={()=>setOpen(true)}
                className="w-full p-0"
            >
                your domains
            </div>
            {open &&(
                <div className="fixed inset-0 z-50 flex items-center justify-center  p-6 backdrop-blur-sm">
                    <div className="bg-[#8B5CF6] backdrop-blur-xl p-6 w-[320px] rounded-2xl shadow-2xl animate-pop border border-purple-200">
                    <p className=" text white font-bold  ">Your Domains</p>
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={()=>setOpen(false)}
                        className="absolute top-2 right-2 text-white bg-#8B5CF6] hover:bg-[#6F42C1] rounded-sm font-semibold p-2 "
                    >
                        X 
                    </div> 
                    
                    <Sites/>
                    </div>
                </div>
            )}
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
                }`
            }
            </style>
        </>
    );
}