var user1 = document.getElementById('user1');
var room1 = document.getElementById('room1');
var user2 = document.getElementById('user2');
var room2 = document.getElementById('room2');

var finishSDPVideoOfferOrAnswer = false;
var isOfferer = false;
var iceCandidates = [];

/**
 *  @desc FOR BROWSER SUPPORTS
 */
var PeerConnection = RTCPeerConnection || window.PeerConnection || window.webkitPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
var IceCandidate = RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

/**
 * @desc PEER CONNECTION AND VIDEO STREAMINGS
 */
let peerConnection, localStream, remoteStream;
//STUN = (Session Traversal Utilities for NAT)
var rtc_server = {
   iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'turn:numb.viagenie.ca', credential: 'webrtc', username: 'admin%40camspark.com' },
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'stun:stun.services.mozilla.com' },
      { url: 'stun:stun.stunprotocol.org:3478' },
      { url: 'turn:numb.viagenie.ca', credential: 'webrtc', username: 'admin%40camspark.com' },
   ],
};

//offer SDP = [Session Description Protocol] tells other peers what you would like
var rtc_media_constraints = {
   mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
   },
};

var rtc_peer_options = {
   optional: [
      { DtlsSrtpKeyAgreement: true }, //To make Chrome and Firefox to interoperate.
   ],
};

const socket = io('http://localhost:8000');
const localVideo = $('.localStream');
const remoteVideo = $('.remoteStream');
const constraints = {
   video: true,
   audio: true,
};

/**
 * @returns {boolean} true if browser supports WebRTC
 */

function hasSupportForVideoChat() {
   return window.RTCPeerConnection &&
      window.RTCIceCandidate &&
      window.RTCSessionDescription &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (RTCPeerConnection.prototype.addStream || RTCPeerConnection.prototype.addTrack)
      ? true
      : false;
}

function reloadCameraStream(isOfferer_) {
   loadMyCameraStream();
   //    loadStrangerCameraStream(isOfferer_);
   msg('Attempted to Reload Camera Streams.');
}
reloadCameraStream();

/**
 * @desc Loads the camera stream of the local
 * @returns {void}
 */
function loadMyCameraStream() {
   if (getUserMedia) {
      getUserMedia.call(
         navigator,
         { video: { facingMode: 'user', aspectRatio: 4 / 3 /*height: 272, width: 322*/ }, audio: { echoCancellation: true } },
         function (localMediaStream) {
            //Add my video
            // localVideo.muted = true;
            // localVideo.autoplay = true;
            // localVideo.attr('playsinline', '');
            // localVideo.attr('webkit-playsinline', '');
            // localVideo[0].srcObject = localMediaStream;
            localStream = localMediaStream;
            console.log(localMediaStream);
         },
         function (e) {
            addStatusMsg('Your Video has error : ' + e);
         }
      );
   } else {
      addStatusMsg('Your browser does not support WebRTC (Camera/Voice chat).');
      return;
   }
}

function loadStrangerCameraStream(isOfferer_) {
   if (!hasSupportForVideoChat()) return;

   //Only add pending ICE Candidates when getOffer() is finished.
   finishSDPVideoOfferOrAnswer = false;
   iceCandidates = []; //clear ICE Candidates array.
   isOfferer = isOfferer_;

   peerConnection = new PeerConnection(rtc_server, rtc_peer_options);

   if (peerConnection.addTrack !== undefined) {
      //! undefined
      console.log(localStream);
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
   } else {
      peerConnection.addStream(localStream);
   }

   peerConnection.onicecandidate = function (e) {
      if (!e || !e.candidate) return;
      socket.emit('ice_candidate', { candidate: e.candidate });
   };

   if (peerConnection.addTrack !== undefined) {
      //!newer technology
      peerConnection.ontrack = function (e) {
         if (remoteStream) return;
         remoteVideo.attr('playsinline', '');
         remoteVideo.attr('webkit-playsinline', '');
         remoteVideo.autoplay = true;
         remoteVideo.muted = true;
         remoteVideo.srcObject = e.streams[0];
         // ! HURRAY! we have a remote stream!
         remoteStream = e.streams[0];
      };
   } else {
      //!older technology
      peerConnection.onaddstream = function (e) {
         if (remoteStream) return;
         remoteStream = e.stream;
         remoteVideo.autoplay = true;
         remoteVideo.muted = true;
         remoteVideo.srcObject = e.stream;
      };
   }

   console.log('loadStrangerCameraStream isOfferer', isOfferer);
   if (isOfferer) {
      /**
       * @desc //!peerConnection.createOffer(successCallback, failureCallback, constraints)
       */
      peerConnection.createOffer(
         //!successCallback and setLocalDescription
         (offer) => {
            peerConnection.setLocalDescription(
               offer,
               () => {
                  console.log('peerConnection.createOffer()', { offer });
                  socket.emit('offer', { offer: offer });
                  msg('Offer sent to server.', { offer });
               },
               //!setLocalDescription error
               (error) => {
                  msg('Error setting local description: ', { error });
               }
            );
         },
         //!failureCallback and msg
         (error) => {
            msg('Error creating offer: ' + error);
         },
         //constraints
         rtc_media_constraints
      );
   }
}

/**
 * Get Ice Candidate from server and send it to peerConnection
 * ICE = Interactive Connectivity Establishment
 */
function iceCandidate(candidate) {
   if (!finishSDPVideoOfferOrAnswer) {
      iceCandidates.push(candidate);
      msg('ICE Candidate added to array.', { candidate });
      return;
   }

   if (!peerConnection) {
      msg('iceCandidate peerConnection not created error.');
      return;
   }

   peerConnection.addIceCandidate(new IceCandidate(candidate));
   msg('Added on time, Peer Ice Candidate = ', { candidate });
}
function getAnswer(answer) {
   if (!hasSupportForVideoChat()) return;
   if (!peerConnection) {
      msg('getAnswer peerConnection not created error.');
      return;
   }
   peerConnection.setRemoteDescription(
      new SessionDescription(answer),
      function () {
         finishSDPVideoOfferOrAnswer = true;
         while (iceCandidates.length) {
            var candidate = iceCandidates.shift();
            try {
               msg('getAnswer setRemoteDescription answer: ', { answer });
               peerConnection.addIceCandidate(new IceCandidate(candidate));
            } catch (err) {
               msg('Error adding ice candidate: ', { err });
            }
         }
      },
      function (error) {
         msg('Error setting remote description: ', { error });
      }
   );
}

function getOffer(offer) {
   if (!hasSupportForVideoChat()) return;

   console.info('getOffer()', offer);
   if (!peerConnection) {
      msg('getOffer peerConnection not created error.');
      return;
   }

   peerConnection.setRemoteDescription(new SessionDescription(offer), function () {
      finishSDPVideoOfferOrAnswer = true;

      while (iceCandidates.length) {
         console.log(iceCandidates.length);
         var candidate = iceCandidates.shift();
         peerConnection.addIceCandidate(new IceCandidate(candidate));
         msg('getOffer setRemoteDescription offer: ', JSON.stringify(offer));
         try {
            peerConnection.addIceCandidate(new IceCandidate(candidate));
         } catch (err) {
            msg('Error adding ice candidate: ', { err });
         }
      }
   });
}

/**-----------------------------------------------------------
 *
 *
 *
 *
 *
 *
 *
 * //! 1. Create PeerConnection
 * //! 2. Add local stream to peerConnection
 * //! 3. Create offer
 * //! 4. Set local description
 * //! 5. Send offer to server
 * //! 6. Wait for answer
 * //! 7. Set remote description
 * //! 8. Wait for ICE candidates
 * //! 9. Add ICE candidates
 * //! 10. Close connection
 */

function closeStrangerCameraStream() {
   remoteVideo.srcObject = null;
   if (peerConnection) peerConnection.close();
}

//close video stream
function closeVideoStream() {
   if (localStream) {
      localStream.getTracks().forEach(function (track) {
         track.stop();
      });
   }
   if (remoteStream) {
      remoteStream.getTracks().forEach(function (track) {
         track.stop();
      });
   }
}

/**
 *
 *
 * socket.io
 */

//!@desc EMIT EVENTS

//join room

$('.btn').on('click', function () {
   var id = $(this).data('id');
   var user = $(this).attr('data-user');
   socket.emit('join-room', { emailId: user, roomId: id });
});

//!@desc LISTEN EVENTS
socket.on('joined-room', (data) => {
   loadStrangerCameraStream(true);
});

socket.on('user-connected', (data) => {
   loadStrangerCameraStream(true);
});

$('#close').on('click', () => {
   closeVideoStream();

   $('.localStream').attr('src', '');
   socket.emit('close');
});

socket.on('connect', () => {
   console.log('Connected');
});

socket.on('disconnect', () => {
   console.log('Disconnected');
});

socket.on('ice_candidate', (data) => {
   iceCandidate(data.candidate);
});

socket.on('offer', (data) => {
   console.log('socket offer', data);
   getOffer(data.offer);
});

socket.on('answer', (data) => {
   getAnswer(data.answer);
});

socket.on('close', () => {
   closeStrangerCameraStream();
});

/**
 *
 *
 * FOR DEBUGGING
 */
function msg(msg, val = null) {
   console.log('%c MESSAGE =>', 'background: red; color: #bada55', msg, val);
   document.getElementById('msg').innerHTML = msg;
}
