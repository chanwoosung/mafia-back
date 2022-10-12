const express = require('express');
const router = express.Router();
const Account = require('../dto/account');
router.get('/', (req, res) => {
    Account.createCollection();
    res.send('Welcome Home')
});
router.get('/confirm', (req, res) => {
    Account.findOne({ip:req.query.ip},(err, account)=> {
    console.log(req.query,account)
    if(account) {
        Account.updateOne({
            ip: req.query.ip,
        },{nickname: req.query.nickname});
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
                res.send({state:true})
            }
        })
    }
  })
});
router.get('/:name', (req, res) => {
//     Account.find({ nickname: req.params.name }, (err, user) => {
//     res.render('main', { user: user } );
//   });
});
module.exports = router;