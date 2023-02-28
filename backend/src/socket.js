const  { Server } = require('socket.io');

const io = new Server({
  cors: {
    origin: '*',
  },
});

const emailToSocketMapping =  new Map();
const socketToEmailMapping =  new Map();

io.on('connection', (socket) => {
    socket.on("join-room",(data)=>{
      const {roomId,emailId} = data
      emailToSocketMapping.set(emailId,socket.id)
      socketToEmailMapping.set(socket.id,emailId)
      socket.join(roomId);


      console.log(`join-room ${roomId} by ${emailId} -> "joined-room"  -> to(roomId:${roomId}) 'user-joined' to ${emailId} `)
      socket.emit("joined-room",{roomId});
      socket.to(roomId).emit('user-joined',{emailId})
    })

    // 1st get the offer from the user and send it to the other user #incomming-call
    socket.on("call-user",(data)=>{
      const {offer,emailId} = data
      const fromEmail = socketToEmailMapping.get(socket.id)
      const socketId = emailToSocketMapping.get(emailId)


      console.log(`call-user ${fromEmail} to ${emailId} get offer -> "incomming-call" -> send fromEmail:${fromEmail} and offer:`,{offer})
      socket.to(socketId).emit("incomming-call",{offer,from: fromEmail})
    })


    socket.on("call-accepted",(data)=>{
      const {answer,emailId} = data
      const socketId = emailToSocketMapping.get(emailId)


      console.log(`call-accepted by (emailId${emailId},answer) -> "call-accepted" send anser`,{answer})
      socket.to(socketId).emit("call-accepted",{answer})
    })
});

module.exports = io;
