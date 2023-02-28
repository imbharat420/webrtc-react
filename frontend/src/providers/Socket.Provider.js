import { createContext,useContext,useMemo } from "react";
import {io} from "socket.io-client"

export const Socket = createContext(null)
export const useSocket = ()=>{
    return useContext(Socket);
} 

const SocketProvider = ({children})=>{
    const socket = useMemo(()=>io("http://localhost:8000"),[]) 
    return(
        <Socket.Provider value={{socket}}>
            {children}
        </Socket.Provider>
    )
}


export default SocketProvider