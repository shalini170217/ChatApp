import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
//create Express app and HTTP server

const app=express();
const server=http.createServer(app);

//Initialize scoket.io server
export const io=new Server(server,{
    cors:{origin:"*"}
})


//store online users
export const userScoketMap={}; // {userId:socketId}

//Socket.io connection handler
io.on("connection",(socket)=>{
   const userId=socket.handshake.query.userId;
   console.log("User connected",userId);

   if(userId) userScoketMap[userId]=socket.id;
   //emit online users to all connected clients
   io.emit("getOnlineUsers",Object.keys(userScoketMap));

   socket.on("disconnect",()=>{
    console.log("User Disconnected",userId);
    delete userScoketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userScoketMap))
   })
})


//Middleware setup

app.use(express.json({limit:"4mb"}));
app.use(cors());


//ROutes setup
app.use("/api/status",(req,res)=>res.send("Server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter)

//conect to mongoDB
await connectDB();

if(process.env.NODE_ENV !=="production"){
const PORT =process.env.PORT || 8000;
server.listen(PORT,()=>console.log("Server is running on PORT:"+PORT)); 

}

//Export server for vercel
export default server;
