import mongoose from "mongoose";
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String, required: false, unique: true, default: null },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dateOfBirth: { type: String, required: false, default: null },
  joiningYear: { type: String, required: false, default: null },
  personalInfo: {
    gender: String,
    phoneNo: String,
    address: String,
  },
  courses: [
    {
      code: { type: String },       // e.g. "CSE101"
      name: { type: String },       // e.g. "Computer Science and Engineering"
    }
  ],
  batchAssigned: [
    {
      batchNo: { type: Number },    // e.g. 1, 2, 3
      section: { type: String }     // optional, e.g. "A", "B", "C"
    }
  ],
  subjectTeaching: [
    {
      subject: { type: String },    // e.g. "Data Structures"
      subjectCode: { type: String }, // e.g. "DSA 901"
      batchNo: { type: Number }     // which batch they teach this subject to
    }
  ]
})

export const Teacher = mongoose.model("Teacher", teacherSchema)