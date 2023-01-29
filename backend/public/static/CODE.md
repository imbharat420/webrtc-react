
![GITHUB SimpleWebRTC](https://github.com/simplewebrtc/SimpleWebRTC)





![LINK](https://stackoverflow.com/questions/62700376/uncaught-typeerror-cannot-read-property-gettracks-of-null)
```js
socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        })
        .then(peerConnection.setRemoteDescription(description))
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
        })
        .catch(error => console.error(error));
});
```




![LINK](https://stackoverflow.com/questions/66062565/failed-to-set-remote-answer-sdp-called-in-wrong-state-stable)

![GITHUB](https://github.com/lnogueir/webrtc-socketio-sample)
```js
const SIGNALING_SERVER_URL = 'ws://127.0.0.1:8003';
// WebRTC config: you don't have to change this for the example to work
// If you are testing on localhost, you can just use PC_CONFIG = {}
const PC_CONFIG = {};

// Signaling methods
let socket = io(SIGNALING_SERVER_URL, {autoConnect: false});

socket.on('data', (data) => {
    console.log('Data received: ', data);
    handleSignalingData(data);
});

socket.on('ready', (msg) => {
    console.log('Ready');
    // Connection with signaling server is ready, and so is local stream
    peers[msg.sid] = createPeerConnection();
    sendOffer(msg.sid);
    addPendingCandidates(msg.sid);
});

let sendData = (data) => {
    socket.emit('data', data);
};

// WebRTC methods
let peers = {}
let pendingCandidates = {}
let localStream;

let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;
            // Connect after making sure thzat local stream is availble
            socket.connect();
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}

let createPeerConnection = () => {
    const pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = onIceCandidate;
    pc.onaddstream = onAddStream;
    pc.addStream(localStream);
    console.log('PeerConnection created');
    return pc;
};

let sendOffer = (sid) => {
    console.log('Send offer');
    peers[sid].createOffer().then(
        (sdp) => setAndSendLocalDescription(sid, sdp),
        (error) => {
            console.error('Send offer failed: ', error);
        }
    );
};

let sendAnswer = (sid) => {
    console.log('Send answer');
    peers[sid].createAnswer().then(
        (sdp) => setAndSendLocalDescription(sid, sdp),
        (error) => {
            console.error('Send answer failed: ', error);
        }
    );
};

let setAndSendLocalDescription = (sid, sessionDescription) => {
    peers[sid].setLocalDescription(sessionDescription);
    console.log('Local description set');
    sendData({sid, type: sessionDescription.type, sdp: sessionDescription.sdp});
};

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log('ICE candidate');
        sendData({
            type: 'candidate',
            candidate: event.candidate
        });
    }
};

let onAddStream = (event) => {
    console.log('Add stream');
    const newRemoteStreamElem = document.createElement('video');
    newRemoteStreamElem.autoplay = true;
    newRemoteStreamElem.srcObject = event.stream;
    document.querySelector('#remoteStreams').appendChild(newRemoteStreamElem);
};

let addPendingCandidates = (sid) => {
    if (sid in pendingCandidates) {
        pendingCandidates[sid].forEach(candidate => {
            peers[sid].addIceCandidate(new RTCIceCandidate(candidate))
        });
    }
}

let handleSignalingData = (data) => {
    // let msg = JSON.parse(data);
    console.log(data)
    const sid = data.sid;
    delete data.sid;
    switch (data.type) {
        case 'offer':
            peers[sid] = createPeerConnection();
            peers[sid].setRemoteDescription(new RTCSessionDescription(data));
            sendAnswer(sid);
            addPendingCandidates(sid);
            break;
        case 'answer':
            peers[sid].setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            if (sid in peers) {
                peers[sid].addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
                if (!(sid in pendingCandidates)) {
                    pendingCandidates[sid] = [];
                }
                pendingCandidates[sid].push(data.candidate)
            }
            break;
    }
};

// Start connection
getLocalStream();
```




```js
socket.on('offer', (id, description) => {
   console.log('offer');
   console.log(id);
   console.log(description);
   peerConnection.setRemoteDescription(description);
   peerConnection
      .createAnswer()
      .then((sdp) => {
         peerConnection.setLocalDescription(sdp);
         socket.emit('answer', id, sdp);
      })
      .catch((e) => {
         console.log(e);
      });
});
```