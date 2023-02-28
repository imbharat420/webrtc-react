import {useContext,createContext,useMemo, useEffect, useCallback, useState} from "react"

export const PeerContext = createContext()

export const usePeer = () => {
    return useContext(PeerContext)
}

 var rtc_server = {
      iceServers: [
                    {urls: "stun:stun.l.google.com:19302"},
                    {urls: "stun:stun.services.mozilla.com"},
                    {urls: "stun:stun.stunprotocol.org:3478"},
                    {urls: "turn:numb.viagenie.ca", credential: "webrtc", username: "admin%40camspark.com"},
                    {url: "stun:stun.l.google.com:19302"},
                    {url: "stun:stun.services.mozilla.com"},
                    {url: "stun:stun.stunprotocol.org:3478"},
                    {url: "turn:numb.viagenie.ca", credential: "webrtc", username: "admin%40camspark.com"}
      ]
    }
    //offer SDP = [Session Description Protocol] tells other peers what you would like
    var rtc_media_constraints = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    };
    
    var rtc_peer_options = {
      optional: [
                  {DtlsSrtpKeyAgreement: true}, //To make Chrome and Firefox to interoperate.
      ]
    }

    var PeerConnection = RTCPeerConnection || window.PeerConnection || window.webkitPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var IceCandidate = RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate;
    var SessionDescription = RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;
 

 const PeerProvider = ({children}) => {
    const [remoteStream,setRemoteStream] = useState(null)
    // 1st create a peer connection
    const peer = useMemo(() => new PeerConnection(rtc_server,rtc_peer_options), [])

    /**
     * @description create offer and set on local description
     */
    const createOffer = async () => {
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        return offer
    }
    /**
     * @description get offer and setRemoteDescription and create answer and set on local description
     */

    const createAnswer = async (offer) => {
        await peer.setRemoteDescription(offer)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        return answer
    }

    const setRemoteAnswer = async (answer) => {
        await peer.setRemoteDescription(answer)
    }

    const sendStream = (stream) => {
        const tracks = stream.getTracks() 
        for(let track of tracks){
            peer.addTrack(track,stream)
        } 
    }

    //! VIDEO OF REMOTE USER
    const handleTrackEvent = useCallback((ev) => {
        //! streams should be screenshare , audio , video
        const streams = ev.streams 
        setRemoteStream(streams[0])
    },[])
    useEffect(()=>{
          peer.addEventListener('track',handleTrackEvent)
          return ()=>{
            peer.removeEventListener('track',handleTrackEvent)
          }
    },[handleTrackEvent, peer])


   

    return (
        <PeerContext.Provider value={{peer,createOffer,createAnswer,setRemoteAnswer,sendStream,remoteStream}}>
            {children}
        </PeerContext.Provider>
    )
}
export default PeerProvider