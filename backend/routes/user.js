const express = require('express');
const router = express.Router();
const zod= require('zod');
const JWT_SECRET = require("../config");
const {User, Account } = require("../db");
const jwt = require('jsonwebtoken');
const {authMiddleware} = require("../middleware");
const mongoose = require("mongoose");
console.log("authMiddleware is:", authMiddleware);

const signupSchema = zod.object({
    username: zod.string().email("Invalid email format").min(1, "Email is required"),
    password: zod.string(),
    firstName: zod.string().min(1, "First name is required"),   
    lastName: zod.string().min(1, "Last name is required")
});
router.post("/signup", async (req,res) =>{
    const body=req.body;
    const {success}=signupSchema.safeParse(body);
    if(!success){
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const user=await User.findOne({
        username: body.username
    })

    if(user){
        return res.json({
            message: "User already exists"
        })
    }

    const dbUser=await User.create(body);
    await Account.create({
        userId: dbUser._id,
        balance: 1+Math.random()*10000 // random balance between 1 and 10000
    })

    const token=jwt.sign({
        userId:dbUser._id,
    },JWT_SECRET);

    res.json({
        message: "User created  successfully",
        token: token
    })
})
const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
});

router.post("/signin", async (req,res) => {
    const body=req.body;
    const {success}=signinBody.safeParse(body);
    if(!success){
        return res.json({
            message: "Invalid inputs"
        })
    }
    const user= await User.findOne({
        username: body.username,
        password: body.password
    })

    if(user){
        const token=jwt.sign({
            userId: user._id,
        }, JWT_SECRET);

        return res.json({
            token: token
        })
    }
    res.status(401).json({
        message: "Invalid username or password"
    })

})

const updateBody=zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})

router.put("/", authMiddleware, async (req, res) => {
    const body = req.body;
    const { success } = updateBody.safeParse(body);
    if (!success) {
        return res.status(401).json({
            message: "error while updating user"
        });
    }

    await User.updateOne({_id: req.userId }, body);

    res.json({
        message: "User updated successfully"
    });
})
    //route to get users from backend filter via firstname or lastname
router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || ""; // default to empty string if no filter is provided meaning all users will be returned

    const users = await User.find({
        $or: [{
            // syntax to do like queries in mongoose
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

//endpoint for user to get their balance
router.get("/balance",authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });
    res.json({
        balance:account.balance
    })
})

//lets the user transfer money to another user
//ideal scenario 
//but not good soln , for good - need to use transactions
//if one of the updates fail, then we need to rollback the other update
router.post("/transfer",authMiddleware, async (req, res) => {
    try{
    const { to } = req.body;
    const amount = Number(req.body.amount);
    if (!to || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
            message: "Invalid inputs"
        });
    }
    const account = await Account.findOne({
        userId: req.userId
    });
    if(account.balance < amount){
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }
    console.log("Transfer to userId:", to);
    console.log("ObjectId format:", new mongoose.Types.ObjectId(to));

    const toAccount = await Account.findOne({
    userId: new mongoose.Types.ObjectId(to)
    });
    if (!toAccount) {
        return res.status(400).json({
            message: "Invalid recipient"
        });
    }
    
        // Subtract from sender
await Account.updateOne(
  { userId: req.userId },
  { $inc: { balance: -amount } }
);

// Add to recipient
await Account.updateOne(
  { userId: new mongoose.Types.ObjectId(to) },
  { $inc: { balance: amount } }
);

    res.json({
        message: "Transfer successful"
    });
    } catch(error){
        console.error("Error during transfer:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
})
module.exports = router;
