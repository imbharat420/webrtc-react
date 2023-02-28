import { useEffect,useCallback,useState } from "react"
import { useSocket } from "../providers/Socket.Provider"
import { usePeer } from "../providers/Peer.Provider"
import ReactPlayer from "react-player"


const Room = () => {
    //! CONTEXT FUNCTIONS
    const {peer,createOffer,createAnswer,setRemoteAnswer,sendStream,remoteStream} = usePeer()

    //! STATES
    const {socket }= useSocket()
    const [myStream,setMyStream]= useState(null)
    const [remoteEmailId,setRemoteEmailId] = useState("")

    //! FUNCTIONS EVENTS SOCKETS
    const handleNewUserJoined =  useCallback(async (data)=>{
        const {emailId}= data
        setRemoteEmailId(emailId) //? set remote email id
        // 2nd create a offer and set on Local Description  #call-user
        const offer = await createOffer(emailId)
        console.log(`${emailId} Joined  handleNewUserJoined(emailId) -> "call-user"`,{offer,emailId}) //! boom
        socket.emit("call-user",{offer,emailId})
    },[createOffer,socket])



    const handleIncomingCall= useCallback(async (data)=>{
        const {offer,from} = data
        console.log(peer.signalingState );
        if (peer.signalingState === 'stable') {
            setRemoteEmailId(from) //? set remote email id
            const answer = await createAnswer(offer)
            console.log(`Incomming call from ${from} handleIncomingCall(offer,from) ->"call-accepted"`,{answer,from})  //! boom
            socket.emit("call-accepted",{emailId:from,answer})
        }
      
    },[createAnswer, peer.signalingState, socket])

    const handleCallAccepted = useCallback(async (data)=>{
        const {answer} = data
        console.log("Call Accepted handleCallAccepted(answer) ->setRemoteAnswer",{answer})  //! boom
        await setRemoteAnswer(answer)
    },[setRemoteAnswer])

    //! SENDING MY STREAM TO OTHERS AND SET LOCAL STREAM
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getUserMediaStream = useCallback(async ()=>{
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;	
        await  getUserMedia.call(navigator, { video: {facingMode: "user", aspectRatio: 4 / 3/*height: 272, width: 322*/}, audio: { echoCancellation : true } },function(localstream){
            setMyStream(localstream)
        }, function(e) {
              console.log(e);
        })
    },[])

    useEffect(()=>{
        getUserMediaStream()
    },[getUserMediaStream])


    useEffect(()=>{
        socket.on("user-joined",handleNewUserJoined)
        socket.on("incomming-call",handleIncomingCall)
         socket.on("call-accepted",handleCallAccepted)

        return ()=>{
            socket.off("user-joined",handleNewUserJoined)
            socket.off("incomming-call",handleIncomingCall)
            socket.off("call-accepted",handleCallAccepted)
        }
    },[handleCallAccepted, handleIncomingCall, handleNewUserJoined, socket])


     const handelNegotiationNeededEvent = useCallback(async () => {
        const localOffer = peer.localDescription
        console.log(`negotiationneeded -> "call-user" again and send  remoteEmailId:${remoteEmailId} and offer:`,localOffer)
        socket.emit("call-user",{offer:localOffer,emailId:remoteEmailId})
    },[peer.localDescription, remoteEmailId, socket])

    useEffect(()=>{
        peer.addEventListener('negotiationneeded',handelNegotiationNeededEvent)
        return ()=>{
              peer.removeEventListener('negotiationneeded',handelNegotiationNeededEvent)
        }
    },[handelNegotiationNeededEvent, peer])


    return(
        <div>
            <h1>Joined SuccessFully by {remoteEmailId}</h1>
            <button onClick={()=> sendStream(myStream)}>Share Video</button>
            <ReactPlayer url={myStream} playing={true}  muted/>
            <ReactPlayer url={remoteStream} playing={true}  />
        </div>
    )
}
export default Room