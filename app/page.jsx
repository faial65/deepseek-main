'use client';
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import Sidebar from "@/components/Sidebar";
import PromptBox from "@/components/Promptbox";
import Message from "@/components/Message";
import { useAppContext } from "@/context/AppContext";

export default function Home() {

  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {selectedChat, selectedDocument} = useAppContext();
  const containerRef = useRef(null);

  useEffect(()=>{
    if(selectedChat){
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

    useEffect(()=>{
    if(containerRef.current ){
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [selectedChat]);

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

        {messages.length === 0?(
          <>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">FA</span>
            </div>
            <p className="text-2xl font-medium">Welcome to FaisalAI</p>
          </div>
          <p className="text-sm mt-2">
            {selectedDocument 
              ? `Ask questions about: ${selectedDocument.filename}` 
              : "How can I help you with"
            }
          </p>
                    {selectedDocument && (
            <div className="mt-4 p-4 bg-blue-600/20 border border-blue-600/30 rounded-xl max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Image src={assets.copy_icon} alt="Document" className="w-5 h-5 opacity-80" />
                <span className="text-blue-400 font-medium">Document Loaded</span>
              </div>
              <p className="text-white/80 text-sm">{selectedDocument.filename}</p>
            </div>
          )}"
          </>
        ):
        (
          <div ref = {containerRef}
          className="relative flex flex-col items-center justify-start w-full
          mt-20 max-h-screen overflow-y-auto">
            <p className="fixed top-8 border border-transparent hover:
            border-gray-500/50 py-1 px-2 rounded-lg font-semibold
            mb-6">{selectedChat?.name}</p>
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} content={msg.content} />
            ))}
            {isLoading && (
              <div className="flex gap-4 max-w-3xl w-full py-3">
                <div className="h-9 w-9 p-1 border border-white/15 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">FA</span>
                </div>
                <div className="loader flex items-center justify-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-white/50 animate-bounce">

                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/50 animate-bounce">
                    
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/50 animate-bounce">
                    
                    </div>

                  </div>
                </div>
              )
            }
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