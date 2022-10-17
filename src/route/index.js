const express = require('express');
const router = express.Router();
const Account = require('../dto/account');
const Room = require('../dto/room');
router.get('/', (req, res) => {
    Account.createCollection();
    res.send('Welcome Home')
});
router.get('/confirm', (req, res) => {
    Account.findOne({ip:req.query.ip},(err, account)=> {
    console.log(req.query,account)
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
    console.log(req.body);
    const newRoom = new Room({
        roomName: req.body.roomName,
        amountCitizen: req.body.amountCitizen,
        amountMafia: req.body.amountMafia,
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
            _id:req.body.roomId
        }
            ,{$set: 
                { userList: [{
                        ip: req.body.ip,
                        nickname: req.body.nickname,
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
        await Room.find()
        .then((data) => {
            res.send({data:data});
        }).catch(err => {
            res.send({state:false,err:err});
        });
    })();
});

module.exports = router;