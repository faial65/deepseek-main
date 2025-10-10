import { assets } from '@/assets/assets'
import React, { useState } from 'react'
import Image from 'next/image'
import { useClerk, UserButton } from '@clerk/nextjs';
import { useAppContext } from '@/context/AppContext';
import ChatLabel from './ChatLabel';
const Sidebar = ({expand,setExpand}) => {

  const {openSignIn} = useClerk();
  const { user, createNewChat, selectedDocument } = useAppContext();
  const [openMenu,setOpenMenu] =useState({id:0,open:false});
  const [showSidebarTooltip, setShowSidebarTooltip] = useState(false);
  const [showNewChatTooltip, setShowNewChatTooltip] = useState(false);

  const handleNewChat = async () => {
    try {
      await createNewChat();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute
    max-md:h-screen relative ${expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}`}>
        <div>
            <div className={`flex ${expand ? 'flex-row gap-10' : 'flex-col items-center gap-8'}`}>
                <div className={`${expand ? 'w-36' : 'w-10'} flex items-center justify-center`}>
                    {expand ? (
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            FAISALAI
                        </h1>
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">FA</span>
                        </div>
                    )}
                </div>

                <div 
                onClick={() => expand? setExpand(false) : setExpand(true)}
                onTouchStart={() => setShowSidebarTooltip(true)}
                onTouchEnd={() => setTimeout(() => setShowSidebarTooltip(false), 2000)}
                className='group relative flex items-center justify-center hover:bg-gray-500/20 transition-all
                duration-300 h-10 w-10 md:h-9 md:w-9 aspect-square rounded-lg cursor-pointer touch-manipulation'>
                    <Image src={assets.menu_icon} alt="Menu Icon" className="md:hidden" />
                    <Image src={expand? assets.sidebar_close_icon: assets.sidebar_icon} alt="Chat Icon"
                     className="hidden md:block w-7" />
                     <div className={`absolute w-max ${expand ? 'left-1/2 -top-12 -translate-x-1/2' : 'left-0 -top-12'} 
                     ${showSidebarTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition bg-black text-white text-sm px-3 py-2 rounded-lg 
                     shadow-lg pointer-events-none z-50`}>
                        {expand? 'Close sidebar' : 'Open sidebar'}
                        <div className={`w-3 h-3 absolute bg-black rotate-45 
                        ${expand ? 'left-1/2 -top-1.5 -translate-x-1/2' : 'left-4 -bottom-1.5'}`}></div>
                     </div>
                </div>
            </div>

              <button 
                onClick={handleNewChat}
                onTouchStart={() => !expand && setShowNewChatTooltip(true)}
                onTouchEnd={() => setTimeout(() => setShowNewChatTooltip(false), 2000)}
                className={`mt-8 flex items-center justify-center cursor-pointer 
                ${expand ? 'bg-primary hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max' : 
                'group relative h-9 w-9 mx-auto hover:bg-gray-500/30 rounded-lg'}`}>
                <Image className={expand ? "w-6" : "w-7"} src={expand ? assets.chat_icon : assets.chat_icon_dull}
                 alt="New Icon" />
                 {!expand && (
                 <div className={`absolute w-max -top-12 -right-12 
                  ${showNewChatTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  transition bg-primary text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-50`}>
                  New Chat
                        <div className={`w-3 h-3 absolute bg-primary rotate-45 left-4 -bottom-1.5`}></div>
                 </div>
                 )}
                 {expand && <p className={`text-white font-medium`}>New Chat</p>}
              </button>

              <div className={`mt-8 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
                <p className='my-1'>Recents</p>
                <ChatLabel openMenu={openMenu} setOpenMenu={setOpenMenu} />
              </div>

              {/* Knowledge Base Section - Hidden but functionality remains active */}
              {/* 
              <div className={`mt-6 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
                <p className='my-1'>Knowledge Base</p>
                
                {selectedDocument ? (
                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-green-400 font-medium text-xs mb-1">📚 Active Knowledge Base</p>
                        <p className="text-white/80 text-sm truncate">{selectedDocument.filename}</p>
                        <p className="text-white/50 text-xs mt-1">Ready for Q&A</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-3 mb-3">
                    <p className="text-gray-400 text-xs">Loading knowledge base...</p>
                  </div>
                )}
              </div>
              */}
        </div>
        <div>
          <div onClick={user ? null : openSignIn}
           className={`flex items-center ${expand ? "hover:bg-white/10 rounded-lg" :
             "justify-center w-full"} gap-3 text-white/60 hover:text-white text-sm mt-2 p-2 transition-colors ${!user ? 'cursor-pointer' : 'cursor-default'}`}>
              {
                user ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden">
                    <UserButton/>
                  </div>
                ) :
                <Image src={assets.profile_icon} alt="Profile icon" className='w-7' />
              }
            
            {expand && <span>My Profile</span> }
          </div>
        </div>
    </div>
  )
}

export default Sidebar