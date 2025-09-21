import mongoose from "mongoose";
const attendenceSchema=new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    name: String,
    email: String,
    batchNo: Number,
    markedAt: { type: Date, default: Date.now }
})
export const Attendence=mongoose.model("Attendence",attendenceSchema);