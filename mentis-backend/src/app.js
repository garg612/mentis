import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

const app= express();
app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["set-cookie"],
    })
)
//common middleware

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"))
app.use(cookieParser())

//import router
import userRoutes from "./routes/user.routes.js";
import studenttimetableRoutes from "./routes/studenttimetable.routes.js";
import attendanceRouter from "./routes/attendance.routes.js";
import teachertimetableRoutes from "./routes/teachertimetable.routes.js";

//routes
app.use("/api/v1/users",userRoutes);
app.use("/api/v1/users",studenttimetableRoutes);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/users",teachertimetableRoutes);

export {app};
