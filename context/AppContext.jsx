"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { createContext,useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const{getToken}=useAuth();

  const [chats,setChats]=useState([]);
  const [selectedChat,setSelectedChat]=useState(null);

  const createNewChat=async()=>{
    try{
      console.log("createNewChat: Starting to create new chat...");
      if(!user) {
        console.log("createNewChat: No user found");
        return null;
      }

      const token=await getToken();
      console.log("createNewChat: Got token:", !!token);

      const response = await axios.post('/api/chat/create',{},{headers:{
        Authorization:`Bearer ${token}`
      }});

      console.log("createNewChat: API response:", response.data);

      if(response.data.success) {
        console.log("createNewChat: Chat created successfully:", response.data.data);
        // Set the newly created chat as selected
        setSelectedChat(response.data.data);
        // Refresh the chats list
        fetchUsersChats();
      } else {
        console.error("createNewChat: Failed to create chat:", response.data);
        toast.error(response.data.message || "Failed to create chat");
      }
    }catch(error){
      console.error("createNewChat: Error:", error);
      toast.error(error.message || "Failed to create chat");
    }
  }
  const fetchUsersChats=async()=>{
    try{
      console.log("fetchUsersChats: Starting to fetch chats...");
      const token = await getToken();
      console.log("fetchUsersChats: Got token:", !!token);
      
      const {data} = await axios.post('/api/chat/get', {}, {headers:{
        Authorization:`Bearer ${token}`
      }})
      
      console.log("fetchUsersChats: API response:", data);
      
      if(data.success){
        console.log("Fetched chats:", data.data);
        setChats(data.data);

        //If the user has no chats, create a new chat
        if(data.data.length===0){
          console.log("No chats found, creating new chat...");
          await createNewChat();
        }else{
          //sort chats by updated date (already sorted from API)
          const sortedChats = data.data.sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt));

          //set recently updated chat as selected chat
          setSelectedChat(sortedChats[0]);
          console.log("Selected chat:", sortedChats[0]);
        }
      }else{
        console.error("fetchUsersChats: API returned error:", data.message);
        toast.error(data.message);
      }
    }catch(error){
      console.error("Error fetching chats:", error);
      toast.error(error.message || "Failed to fetch chats");
    } 
  }

useEffect(()=>{
  if(user){
    fetchUsersChats();
  }
},[user]);
  const value = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat
  }
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
