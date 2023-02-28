import React, { useState } from 'react'
import { useSocket } from '../providers/Socket.Provider'
import {useNavigate} from "react-router-dom"

function Home() {   
    const navigate= useNavigate();
    const {socket} = useSocket()
    const [formdata,setFormdata] = useState({
        emailId:"",
        roomId:""
    }) 

    const InputHandler = (e)=>{
        setFormdata((prev)=>({
            ...prev,
            [e.target.name]:e.target.value
        }))
    }

    const submitHandler = (e)=>{
        e.preventDefault();
        socket.emit("join-room",formdata); 
        navigate(`/room/${formdata.roomId}`) 
    }

    return (
    <div>
      <form onSubmit={submitHandler}>
        <label>email</label>
        <input name="emailId" id="emailId" type="text" onInput={InputHandler} />

        <label>Room</label>
        <input name="roomId" id="roomId" type="text" onInput={InputHandler}/>

        <button type='submit' onClick={submitHandler}>Submit</button>
      </form>
    </div>
  )
}

export default Home
