const express = require('express');
const router = express.Router();

const userRouter = require('./user');
router.use('/user', userRouter); // Mount user routes at /user
module.exports=router;