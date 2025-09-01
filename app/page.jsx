'use client';
import { useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import Sidebar from "@/components/Sidebar";
import PromptBox from "@/components/Promptbox";
import Message from "@/components/Message";

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div className="flex h-screen">
        <Sidebar expand={expand} setExpand={setExpand} />
        <div className="flex-1 flex flex-col justify-center items-center px-4
         pb-8 bg-[#292a2d] text-white relative">
         <div className="md:hidden absolute top-6 px-4 flex items-center
          justify-between w-full">
          <Image onClick={() => (expand ? setExpand(false) : setExpand(true))}
          className="rotate-180" src={assets.menu_icon} alt="Menu Icon" />
          <Image className="opacity-70" src={assets.chat_icon} alt="Chat Icon" />
         </div>

        {messages.length!==0?(
          <>
          <div className="flex items-center gap-3">
            <Image src={assets.logo_icon} alt="Logo Icon" className="h-16"/>
            <p className="text-2xl font-medium">Welcome to DeepSeek</p>
          </div>
          <p className="text-sm mt-2">How can I help you with</p>
          </>
        ):
        (
          <div>
            <Message role='ai' content='What is next js' />
          </div>
        )
        }
        <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
        <p className="text-xs absolute bottom-1 text-gray-500">AI- generated, for reference only</p>


        </div>
      </div>
    </div>
  );
}