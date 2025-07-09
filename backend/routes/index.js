const express = require('express');
const router = express.Router();

const userRouter = require('./user');
router.use('/user', userRouter); // Mount user routes at /user

const accountRouter = require('./account');
router.use('/account', accountRouter); // Mount account routes at /account

module.exports=router;