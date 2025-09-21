import { Timetable } from "../models/timetable.models.js";
import dayjs from "dayjs";
import { Student } from "../models/student.models.js";
import { Teacher } from "../models/teacher.models.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";

const getStudentTimetable = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) {
        throw new Apierror(401, "Student not found");
    }

    const todayday = dayjs().format("dddd");

    const timetable = await Timetable.findOne({ batchNo: student.batchNo });
    if (!timetable) {
        throw new Apierror(401, "Timetable not found");
    }

    let todayclasses = timetable.entries.filter(e => e.day === todayday);

    const teacherIds = todayclasses.map(c => c.empId);
    const teachers = await Teacher.find({ empId: { $in: teacherIds } });

    todayclasses = todayclasses.map(c => {
        const teacher = teachers.find(t => t.empId === c.empId);
        return {
            ...c.toObject(),
            teacherName: teacher ? teacher.name : "Unknown",
            subjectCode: c.subjectCode || c.subject // Use subjectCode if available, fallback to subject
        };
    });

    res.json(new Apiresponse(200, {
        date: dayjs().format("YYYY-MM-DD"),
        day: todayday,
        batch: student.batchNo,
        classes: todayclasses
    }, "Student timetable fetched successfully"));
});

export {
    getStudentTimetable
}
