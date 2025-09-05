"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { headers } from "next/headers";
import { createContext,use,useContext } from "react";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const{getToken}=useAuth();

  const [chats,setChats]=useState([]);
  const [selectedChat,setSelectedChat]=useState(null);

  const createNewChat=async()=>{
    try{
      if(!user) return null;

      const token=await getToken();

      await axios.post('/api/chat/create',{},{headers:{
        Authorization:`Bearer ${token}`
      }})

      fetchUsersChats();
    }catch(error){
      toast.error(error.message);
    }
  }
  const fetchUsersChats=async()=>{
    try{
      const token = await getToken();
      const {data} = await axios.post('/api/chat/get', {headers:{
        Authorization:`Bearer ${token}`
      }})
      if(data.success){
        console.log(data.data);
        setChats(data.data);

        //If the user has no chats, create a new chat
        if(data.data.length===0){
          createNewChat();
          return fetchUsersChats();
        }else{
          //sort chats by updated date
          data.data.sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt));

          //set recently updated chat as selected chat
          setSelectedChat(data.data[0]);
          console.log(data.data[0]);
        }
      }else{
        toast.error(data.message);
      }
    }catch(error){
      toast.error(error.message);
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
