const express = require('express');
const router = express.Router();
const Account = require('../dto/account');
const Room = require('../dto/room');
const socket = require('../socket');
router.get('/', (req, res) => {
    Account.createCollection();
    res.send('Welcome Home')
});
router.get('/confirm', (req, res) => {
    Account.findOne({ip:req.query.ip},(err, account)=> {
    if(account) {
        (async()=>{
            await Account.updateOne({
                ip: req.query.ip,
            },{nickname: req.query.nickname});
            res.send({state:true});
        })();
    } else {
        const newAccount = new Account({
            ip: req.query.ip,
            job: '',
            nickname: req.query.nickname,
        })
        newAccount.save((err, data) => {
            if(err) {
                console.log(err);
            } else {
                console.log(data);
                res.send({state:true});
            }
        })
    }
  })
});

router.post('/make-room', (req, res) => {
    const newRoom = new Room({
        roomName: req.body.roomName,
        amountCitizen: req.body.amountCitizen,
        amountMafia: req.body.amountMafia,
        process: false,
        roomOwner: req.body.roomOwner,
    })
    newRoom.save((err, data) => {
        if(err) {
            console.log(err);
        } else {
            console.log(data);
            res.send({state:true,roomId: data._id});
        }
    });
});

router.post('/join-room', (req, res) => {
    (async()=>{
        await Room.findOneAndUpdate({
            _id:req.body.roomId,
        }
            ,{$push: 
                { userList: [{
                        ip: req.body.ip,
                        nickname: req.body.nickname,
                        live: true,
                    }] 
                }
            }
        ).then(() => {
            res.send({state:true});
        }).catch(err => {
            res.send({state:false,err:err});
        });
    })();
});

router.get('/get-rooms', (req, res) => {
    (async()=>{
        await Room.find({
            process: false,
        })
        .then((data) => {
            res.send({data:data});
        }).catch(err => {
            res.send({state:false,err:err});
        });
    })();
});

router.post('/get-ready', (req, res) => {
    (async()=>{
        await Room.findOneAndUpdate({
            _id: req.body.params.roomId,
            process: false,
        }, {
            $push: {
                'voteList': {
                    ip: req.body.params.ip,
                    nickname: req.body.params.nickname,
                }
            }
        })
        .then(async(data) => {
            const roomStat = await Room.findOne({
                _id: req.body.params.roomId,
            });
            roomStat.userList.length === roomStat.voteList.length ? res.send({data:{state:true,allReady:true}}):res.send({data:{state:true,allReady:false}});
        }).catch(err => {
            res.send({data:{state:false,err:err}});
        });
    })();
});

router.post('/cancel-ready', (req, res) => {
    (async()=>{
        await Room.findOneAndUpdate({
            _id: req.body.params.roomId,
            process: false,
        }, {
            $pull: {
                'voteList': {
                    ip: req.body.params.ip,
                    nickname: req.body.params.nickname,
                }
            }
        })
        .then(() => {
            res.send({data:{state:true}});
        }).catch(err => {
            res.send({data:{state:false,err:err}});
        });
    })();
});

router.get('/get-myRole', (req, res) => {
    (async()=>{
        await Room.findOne({
            _id: req.query.roomId,
            process: true,
        })
        .then((data) => {
            const userRole = {userList:data.userList}
            userRole.role = data.mafiaList.filter((item)=> item.ip === req.query.ip && item.nickname === req.query.nickname).length!==0?'mafia':'citizen'
            console.log("userRole",userRole);
            res.send({data:userRole});
            return 
        }).catch(err => {
            res.send({data:{state:false,err:err}});
        });
    })();
});

router.post('/vote-mafia', (req, res) => {
    (async()=>{
        console.log(req.query)
        console.log(req.body)
        Room.findOneAndUpdate({
            _id: req.body.params.roomId,
            process: true,
        }, {
            $push: {
                'voteList': {
                    ip: req.body.params.ip,
                    nickname: req.body.params.vote,
                }
            }
        })
        .then(async (data) => {
            console.log(data);
            const roomData = await Room.findOne({
                _id: req.body.params.roomId,
                process: true,
            });
            if (roomData.voteList.length === (roomData.citizenList.length+roomData.mafiaList.length))
                res.send({ data: { state: true, allReady: true } });
            else
                res.send({ data: { state: true, allReady: false  } });
        }).catch(err => {
            res.send({ data: { state: false, err: err } });
        });
    })();
});

module.exports = router;