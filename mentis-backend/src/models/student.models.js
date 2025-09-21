import mongoose from "mongoose";
const studentSchema= new mongoose.Schema({
    name: { type: String, required: true },
    batchNo: { type: Number, required: true },
    rollNo: { type: String, required: true, unique: true },
    degree: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    academicSession: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    personalInfo: {
        fatherName: String,
        motherName: String,
        dateOfBirth: String,
        gender: String,
        phoneNo: String,
        address: String,
  },
  attendanceHistory: [
    {
      subject: String,
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["Present", "Absent"], default: "Absent" }
    }
  ]
})

export const Student=mongoose.model("Student",studentSchema);