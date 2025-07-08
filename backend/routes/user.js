const express = require('express');
const router = express.Router();
const zod= require('zod');
const {JWT_SECRET} = require("../config");
const {User} = require("../db");
const jwt = require('jsonwebtoken');
const authMiddleware = require("../middleware");

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

    const user=User.findOne({
        username: body.username
    })

    if(user._id){
        return res.json({
            message: "User already exists"
        })
    }

    const dbUser=await User.create(body);
    const token=JWT_SECRET.sign({
        userId:dbUser._id,
    },JWT_SECRET);

    res.json({
        message: "User created  successfully",
        token: token
    })
})

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



module.exports = router;
