import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  return (
    <div className="">
      <div className="min-h-screen flex items-center justify-center bg-[#181c23]">
            <div className="w-full max-w-md p-8 bg-[#24292f] rounded-2xl shadow-lg">
              <h1 className="text-2xl font-semibold text-white mb-6 text-center">Log in</h1>
      
            
      
              <div className="mt-4">
                <button
                  
                  className="w-full bg-red-600 text-white py-2 rounded-lg mt-2"
                >
                  Login with Google
                </button>
      
                <button
                  
                  className="w-full bg-gray-700 text-white py-2 rounded-lg mt-2"
                >
                  Login with GitHub
                </button>
              </div>
            </div>
          </div>
    </div>
  );
}
