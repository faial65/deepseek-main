import { assets } from '@/assets/assets'
import React, { useState } from 'react'
import Image from 'next/image'
import { useClerk, UserButton } from '@clerk/nextjs';
import { useAppContext } from '@/context/AppContext';
import ChatLabel from './ChatLabel';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
const Sidebar = ({expand,setExpand}) => {

  const {openSignIn} = useClerk();
  const { user, createNewChat, selectedDocument, setSelectedDocument } = useAppContext();
  const [openMenu,setOpenMenu] =useState({id:0,open:false});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentList, setShowDocumentList] = useState(false);

  const handleNewChat = async () => {
    try {
      await createNewChat();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute
    max-md:h-screen ${expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}`}>
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

                <div onClick={() => expand? setExpand(false) : setExpand(true)}
                className='group relative flex items-center justify-center hover:bg-gray-500/20 transition-all
                duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer'>
                    <Image src={assets.menu_icon} alt="Menu Icon" className="md:hidden" />
                    <Image src={expand? assets.sidebar_close_icon: assets.sidebar_icon} alt="Chat Icon"
                     className="hidden md:block w-7" />
                     <div className={`absolute w-max ${expand ? 'left-1/2 -top-12 -translate-x-1/2' : 'left-0 -top-12'} 
                     opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg 
                     shadow-lg pointer-events-none`}>
                        {expand? 'Close sidebar' : 'Open sidebar'}
                        <div className={`w-3 h-3 absolute bg-black rotate-45 
                        ${expand ? 'left-1/2 -top-1.5 -translate-x-1/2' : 'left-4 -bottom-1.5'}`}></div>
                     </div>
                </div>
            </div>

              <button 
                onClick={handleNewChat}
                className={`mt-8 flex items-center justify-center cursor-pointer 
                ${expand ? 'bg-primary hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max' : 
                'group relative h-9 w-9 mx-auto hover:bg-gray-500/30 rounded-lg'}`}>
                <Image className={expand ? "w-6" : "w-7"} src={expand ? assets.chat_icon : assets.chat_icon_dull}
                 alt="New Icon" />
                 <div className='absolute w-max -top-12 -right-12 opacity-0 group-hover:opacity-100
                  transition bg-primary text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none'>
                  New Chat
                        <div className={`w-3 h-3 absolute bg-primary rotate-45 left-4 -bottom-1.5`}></div>
                 </div>
                 {expand && <p className={`text-white font-medium`}>New Chat</p>}
              </button>

              <div className={`mt-8 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
                <p className='my-1'>Recents</p>
                <ChatLabel openMenu={openMenu} setOpenMenu={setOpenMenu} />
              </div>

              {/* Document Section */}
              <div className={`mt-6 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
                <p className='my-1'>Documents</p>
                
                {selectedDocument && (
                  <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-blue-400 font-medium text-xs mb-1">Active Document</p>
                        <p className="text-white/80 text-sm truncate">{selectedDocument.filename}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDocument(null)}
                        className="ml-2 p-1 hover:bg-white/10 rounded"
                      >
                        <Image src={assets.sidebar_close_icon} alt="Remove" className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="w-full flex items-center gap-2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <Image src={assets.copy_icon} alt="Upload" className="w-4 h-4" />
                    Upload Document
                  </button>
                  
                  <button
                    onClick={() => setShowDocumentList(true)}
                    className="w-full flex items-center gap-2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    <Image src={assets.search_icon} alt="Browse" className="w-4 h-4" />
                    Browse Documents
                  </button>
                </div>
              </div>
        </div>
        <div>
          <div className={`flex items-center cursor-pointer relative group ${expand ? 
          "gap-1 text-white/80 text-sm p-2.5 border-primary rounded-lg hover:bg-white/10"
           : "h-10 w-10 mx-auto hover:bg-gray-500/30 rounded-lg"}`}>
            <Image className={expand? 'w-5' : 'w-6.5 mx-auto'} 
            src={expand? assets.phone_icon : assets.phone_icon_dull} alt="Phone Icon" />
            <div className={`absolute -top-60 pb-8 ${!expand && "-right40"}
            opacity-0 group-hover:opacity-100 hidden group-hover:block transition`}>
              <div className='relative w-max bg-black text-white text-sm p-3 rounded-lg shadow-lg'>
              <Image src={assets.qrcode} alt="QR Code Icon" className='w-44'/>
              <p>Scan to get the FaisalAI App</p>
              <div className={`w-3 h-3 absolute bg-black rotate-45 
                ${expand ? 'right-1/2' : 'left-4'} -bottom-1.5`}></div>
            </div>
            </div>
            {expand && <><span>Get App</span><Image src={assets.new_icon} alt=""/></>}
          </div>

          <div onClick={user ? null : openSignIn}
           className={`flex items-center ${expand ? "hover:bg-white/10 rounded-lg" :
             "justify-center w-full"} gap-3 text-white/60 text-sm mt-2 p-2 ${!user ? 'cursor-pointer' : 'cursor-default'}`}>
              {
                user ? <UserButton/> :
                <Image src={assets.profile_icon} alt="Profile icon" className='w-7' />
              }
            
            {expand && <span>My Profile</span> }
          </div>
        </div>

        {/* Document Upload Modal */}
        <DocumentUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onDocumentUploaded={(doc) => {
            // Optionally auto-select the uploaded document
            setSelectedDocument(doc);
          }}
        />

        {/* Document List Modal */}
        <DocumentList
          isOpen={showDocumentList}
          onClose={() => setShowDocumentList(false)}
          onDocumentSelect={(doc) => {
            setSelectedDocument(doc);
          }}
        />
    </div>
  )
}

export default Sidebar