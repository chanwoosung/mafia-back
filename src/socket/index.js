const colors = require("colors/safe");
const calculateArray = require("../calculateArray");
const room = require("../dto/room");
const shuffle = require("../shuffle");
const timer = require("../timer");

const SOCKET_EVENT = {
  JOIN_ROOM: "JOIN_ROOM",
  UPDATE_NICKNAME: "UPDATE_NICKNAME",
  SEND_MESSAGE: "SEND_MESSAGE",
  RECEIVE_MESSAGE: "RECEIVE_MESSAGE",
  QUIT_ROOM: "QUIT_ROOM",
  GET_READY: "GET_READY",
  CANCEL_READY: "CANCEL_READY",
  ALL_READY: "ALL_READY",
  GAME_START: "GAME_START",
  START_VOTE: "START_VOTE",
  RECEIVE_EVENT: "RECEIVE_EVENT",
  ANNOUNCE_RESULT: "ANNOUNCE_RESULT",
};

const sendMessage = (socketIo,type,requestData) => {
  const responseData = {
    ...requestData,
    type,
    time: new Date(),
  };
  socketIo.to(requestData.roomId).emit(SOCKET_EVENT.RECEIVE_MESSAGE, responseData);
}

const sendEvent = (socketIo,type,requestData) => {
  const responseData = {
    ...requestData,
    type,
    time: new Date(),
  };
  socketIo.to(requestData.roomId).emit(SOCKET_EVENT.RECEIVE_EVENT, responseData);
}

module.exports = function (socketIo) {
  const sockets = [];
  socketIo.on("connection", function (socket) {
    sockets.push(socket);
    socket["nickname"] = "유저";
    console.log("Connected to Browser");
    console.log(`${colors.brightGreen("socket connection succeeded.")}`);

    socket.on(SOCKET_EVENT.ANNOUNCE_RESULT, requestData => {
      // sendMessage(socketIo,SOCKET_EVENT.SEND_MESSAGE,{...requestData,content:'개표하겠습니다!!'});
      (async()=>{
        const roomData = await room.findOne({
            _id:requestData.roomId
            }
        )
        const result = calculateArray(roomData.userList,roomData.voteList)
        console.log("-----------------")
        console.log(result);
        console.log("-----------------")
        sendEvent(socketIo,SOCKET_EVENT.ANNOUNCE_RESULT,{...requestData,content:result});
      })();
    });

    socket.on(SOCKET_EVENT.JOIN_ROOM, requestData => {
      console.log(requestData.roomId);
      socket.join(requestData.roomId);
      sendMessage(socketIo,SOCKET_EVENT.JOIN_ROOM,requestData);
    });

    socket.on(SOCKET_EVENT.SEND_MESSAGE, requestData => {
      sendMessage(socketIo,SOCKET_EVENT.SEND_MESSAGE,requestData);
    });
    
    socket.on(SOCKET_EVENT.QUIT_ROOM,requestData => {
      (async()=>{
        await room.update({
            _id:requestData.roomId
            }
            ,{$pull: 
                { 'userList': {
                        ip: requestData.ip,
                        nickname: requestData.nickname,
                        live: true,
                    } 
                }
              }
        )
      })();
    });

    socket.on(SOCKET_EVENT.ALL_READY, requestData => {
      console.log('ALL READY!!');
      (async()=>{
        await room.updateMany({_id:requestData.roomId},{$set: {'process':true,'voteList':[]}});
        const data = await room.findOne({_id:requestData.roomId});
        console.log((data.userList));
        const shuffledList = shuffle(data.userList);
        const mafiaList = shuffledList.splice(0,data.amountMafia);
        const citizenList = shuffledList.splice(data.amountMafia-1,data.amountCitizen);
        console.log((shuffledList));
        console.log((mafiaList));
        console.log((citizenList));
        await room.updateMany({_id:requestData.roomId},{$set: {
          'mafiaList': mafiaList,
          'citizenList': citizenList,
        }});
        sendEvent(socketIo,SOCKET_EVENT.GAME_START,requestData);
        sendMessage(socketIo,SOCKET_EVENT.GAME_START,requestData);
        const nowTime = new Date().getTime();
        const flag = timer(nowTime+100000,
          ()=>{
            console.log(requestData);
              sendMessage(socketIo,SOCKET_EVENT.START_VOTE,{...requestData,content:'투표를 시작해주세요'});
      }
        );
      })();
    });

    // socket.on(SOCKET_EVENT.GET_READY,requestData => {
    //   (async()=>{
    //     await room.updateOne({
    //         _id:requestData.roomId
    //         }
    //         ,{$set: 
    //             { 'voteList': {
    //                     ip: requestData.ip,
    //                     nickname: requestData.nickname,
    //                 } 
    //             }
    //           }
    //     )
    //   })();
    // });

    // socket.on(SOCKET_EVENT.QUIT_ROOM,requestData => {
    //   (async()=>{
    //     await room.updateOne({
    //         _id:requestData.roomId
    //         }
    //         ,{$pull: 
    //             { 'voteList': {
    //                     ip: requestData.ip,
    //                     nickname: requestData.nickname,
    //                 } 
    //             }
    //           }
    //     )
    //   })();
    // });

    socket.on("disconnect", reason => {
      console.log(`${colors.brightGreen("disconnect")}: ${reason}`);
    });
  });
};
