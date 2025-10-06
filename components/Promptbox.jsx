import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({isLoading, setIsLoading}) => {

    const [prompt, setPrompt] = useState  ('');
    const { user, chats, setChats, selectedChat, setSelectedChat, selectedDocument, createNewChat } = useAppContext();

    const handleKeyDown=(e)=>{
        if(e.key==='Enter' && !e.shiftKey){
            e.preventDefault();
            sendPrompt(e);
        }
    }

    const sendPrompt=async(e)=>{
        const promptCopy= prompt;

        try{
            e.preventDefault();
            if(!user) return toast.error('Login to send a message');
            if(isLoading) return toast.error('Wait for the response');
            if(!selectedChat) {
                console.log('No chat selected. Current selectedChat:', selectedChat);
                console.log('Available chats:', chats);
                
                // Try to create a new chat if none exists
                if(chats.length === 0) {
                    console.log('No chats available, creating new chat...');
                    toast.error('Creating new chat...');
                    await createNewChat();
                    return; // Exit and let user try again
                }
                
                return toast.error('No chat selected');
            }

            console.log('Sending prompt to chat:', selectedChat._id);

            setIsLoading(true);
            setPrompt('');

            const userPrompt={
                role:"user",
                content:prompt,
                timestamp:Date.now()
            }

            //saving user prompt to the chat array

            setChats(prevChats=>prevChats.map((chat)=> chat._id===selectedChat._id?
             {
                ...chat, 
                messages:[...chat.messages, userPrompt]
            }:chat));
            //saving user prompt in selected chat

            setSelectedChat(prev=> prev ? {
                ...prev,
                messages:[...prev.messages, userPrompt]
            } : prev);

            const {data}=await axios.post('/api/chat/groq-free',{
                chatId:selectedChat._id,
                prompt: promptCopy,
                documentId: selectedDocument?._id
            })

            console.log("AI API response:", data);

            if(data.success){
                console.log("AI response received:", data.message);
                
                const message = data.message;
                const messageTokens = message.split(' ');
                let assistantMessage = {
                    role: "assistant",
                    content: "",
                    timestamp: Date.now()
                };
                
                setSelectedChat(prev=> prev ? {
                    ...prev,
                    messages:[...prev.messages, assistantMessage]
                } : prev);
                
                for(let i=0; i<messageTokens.length; i++){
                    setTimeout(()=>{
                        assistantMessage.content = messageTokens.slice(0,i+1).join(' ');
                        setSelectedChat((prev)=> prev ? {
                            ...prev,
                            messages: [
                                ...prev.messages.slice(0,-1),
                                assistantMessage
                            ]
                        } : prev);
                    }, i * 100)
                }
            }else{
                toast.error(data.message);
                setPrompt(promptCopy);
            }

        }catch(error){
            toast.error(error.message);
            setPrompt(promptCopy);
        }finally{
            setIsLoading(false);
        }

    }

  return (
    <form onSubmit={sendPrompt}
    className={`w-full ${selectedChat?.messages.length > 0 ?"max-w-3xl":"max-w-2xl"} bg-[#404045] p-4 
    rounded-3xl mt-4 transition-all`}>
        <textarea
        onKeyDown={handleKeyDown}
         className='outline-none w-full bg-transparent 
        resize-none break-words overflow-hidden' 
        rows={2} placeholder='Message FaisalAI' required
        onChange={(e) => setPrompt(e.target.value)} value={prompt}/>

        <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center gap-2'>
                <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 
                rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
                    <Image src={assets.deepthink_icon} alt="Deepthink Icon" className='h-5' />
                    DeepThink (R1)
                </p>
                <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 
                rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
                    <Image src={assets.search_icon} alt="Search Icon" className='h-5' />
                    Search (R1)
                </p>
            </div>

            <div className='flex items-center gap-2'>
                <Image src={assets.pin_icon} alt="Pin Icon" className='w-4 cursor-pointer' />
                <button className={`${prompt? "bg-primary" : "bg-[#71717a]"}
                rounded-full p-2 cursor-pointer`}>
                    <Image src={prompt? assets.arrow_icon : assets.arrow_icon_dull}
                     alt="Pin Icon" className='w-3.5 aspect square' />
                </button>
            </div>
        </div>
    </form>
  )
}

export default PromptBox