const colors = require("colors/safe");
const calculateArray = require("../calculateArray");
const room = require("../dto/room");
const shuffle = require("../shuffle");
const timer = require("../timer");
const checkJob = require("../checkJob");

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
  GAME_CONTINUE: "GAME_CONTINUE",
  MAFIA_GAME_END: "MAFIA_GAME_END",
  CITIZEN_GAME_END: "CITIZEN_GAME_END",
  MAFIA_TIME: "MAFIA_TIME",
  KILL_CITIZEN: "KILL_CITIZEN",
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

    socket.on(SOCKET_EVENT.KILL_CITIZEN, requestData => {
      (async()=>{
        sendEvent(socketIo,SOCKET_EVENT.KILL_CITIZEN,{...requestData,content:`${requestData.nickname}님이 마피아에게 살해당했습니다.`});
        sendMessage(socketIo,SOCKET_EVENT.START_VOTE,{...requestData,content:'2분 뒤 투표가 다시 시작됩니다.'});
        const nowTime = new Date().getTime();
        const flag = timer(nowTime+100000,
          ()=>{
            console.log(requestData);
              sendMessage(socketIo,SOCKET_EVENT.START_VOTE,{...requestData,content:'투표를 시작해주세요'});
      })
       
      })();
    });

    socket.on(SOCKET_EVENT.ANNOUNCE_RESULT, requestData => {
      // sendMessage(socketIo,SOCKET_EVENT.SEND_MESSAGE,{...requestData,content:'개표하겠습니다!!'});
      (async()=>{
        const roomData = await room.findOne({
            _id:requestData.roomId
            }
        )
        const result = calculateArray(roomData.userList,roomData.voteList);
        sendEvent(socketIo,SOCKET_EVENT.ANNOUNCE_RESULT,{...requestData,content:result});
        if(result.nicknameArr.length > 1) {
          sendMessage(socketIo,SOCKET_EVENT.START_VOTE,{...requestData,content:'2분 뒤 투표가 다시 시작됩니다.'});
          const nowTime = new Date().getTime();
          const flag = timer(nowTime+100000,
            ()=>{
              console.log(requestData);
                sendMessage(socketIo,SOCKET_EVENT.START_VOTE,{...requestData,content:'투표를 시작해주세요'});
        })
        } else 
        if(checkJob(result.nicknameArr[0],roomData.mafiaList)){
          console.log('$%^work$%^')
          sendEvent(socketIo,SOCKET_EVENT.MAFIA_GAME_END,{...requestData,content:`처형된 사람은 마피아였습니다. 게임이 끝났습니다.`});
        } else {
          console.log('!@#work!@#')
          await room.updateOne({
            _id:requestData.roomId
          },{
            $set:{
              voteList:[],
            },
          })
          await room.updateOne({
            _id:requestData.roomId
            },{
            $pull: {
              citizenList:{
                _id:result.idArr[0]
              }
            }
          });
          const resultData = await room.find({
            _id:requestData.roomId
          })
          console.log(resultData)
          if(resultData.citizenList.length === resultData.mafiaList.length) {
            sendEvent(socketIo,SOCKET_EVENT.CITIZEN_GAME_END,{...requestData,content:`처형된 사람은 일반인이였습니다. 마피아의 승리입니다.`})
          } else {
            console.log("?!@#!@#!?");
            sendEvent(socketIo,SOCKET_EVENT.MAFIA_TIME,{...requestData,content:`처형된 사람은 일반인이였습니다. 마피아는 죽일 시민을 정해주세요.`});
            console.log("^%&^%&(");
          }
        }
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

    socket.on("disconnect", reason => {
      console.log(`${colors.brightGreen("disconnect")}: ${reason}`);
    });
  });
};
