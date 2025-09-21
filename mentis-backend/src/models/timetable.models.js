import mongoose from "mongoose";
const timetableSchema = new mongoose.Schema({
    batchNo: { type: Number, required: true },
    entries: [
        {
            day: { type: String, required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            subject: { type: String, required: true },
            subjectCode: { type: String, required: false },
            empId: { type: String, required: false },
            room: String

        }
    ]
});

export const Timetable = mongoose.model("Timetable", timetableSchema);