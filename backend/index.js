const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json()); // this is a body parser to parse JSON bodies

const mainRouter = require("./routes/index");




app.use("/api/v1", mainRouter)//for req goin to /api/v1 then these req pls go to this router
//a way to prefix to a router
// /api/v1/user/signup

app.listen(3000)

