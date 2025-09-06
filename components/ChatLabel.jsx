import { assets } from '@/assets/assets'
import Image from 'next/image'
import React from 'react'
import { useAppContext } from '@/context/AppContext'

const ChatLabel = ({ openMenu, setOpenMenu }) => {
    const { chats, selectedChat, setSelectedChat } = useAppContext();

    const handleMenuToggle = (chatId) => {
        setOpenMenu(prev => ({
            id: chatId,
            open: prev.id === chatId ? !prev.open : true
        }));
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        console.log('Selected chat:', chat);
    };

    return (
        <div className='space-y-1'>
            {chats?.map((chat) => (
                <div 
                    key={chat._id} 
                    className={`flex items-center justify-between p-2 text-white/80
                    hover:bg-white/10 rounded-lg text-sm group cursor-pointer transition-colors
                    ${selectedChat?._id === chat._id ? 'bg-white/10' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                >
                    <p className='group-hover:max w-5/6 truncate' title={chat.name || 'New Chat'}>
                        {chat.name || 'New Chat'}
                    </p>
                    <div className='group relative flex items-center justify-center h-6 w-6 
                    aspect-square hover:bg-black/80 rounded-lg'>
                        <Image 
                            src={assets.three_dots} 
                            alt='three dots' 
                            className={`w-4 ${openMenu.id === chat._id && openMenu.open ? '' : 'hidden'} group-hover:block cursor-pointer`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(chat._id);
                            }}
                        />
                        <div className={`absolute -right-36 top-6 bg-gray-700 rounded-xl
                                         w-max p-2 z-10 ${openMenu.id === chat._id && openMenu.open ? '' : 'hidden'}`}>
                            <div className='flex items-center gap-2 hover:bg-white/10 
                                    px-3 py-2 rounded-lg cursor-pointer'>
                                <Image src={assets.pencil_icon} alt='pencil icon' className='w-4' />
                                <p>Rename</p>
                            </div>
                            <div className='flex items-center gap-2 hover:bg-white/10 px-3 py-2
                            rounded-lg cursor-pointer'>
                                <Image src={assets.delete_icon} alt='delete icon' className='w-4' />
                                <p>Delete</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Show message when no chats exist */}
            {(!chats || chats.length === 0) && (
                <div className='text-white/40 text-xs p-2 text-center'>
                    No recent chats
                </div>
            )}
        </div>
    )
}

export default ChatLabel