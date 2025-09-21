import { Timetable } from "../models/timetable.models.js";
import { Teacher } from "../models/teacher.models.js";
import dayjs from "dayjs";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/ApiResponse.js";

const getteachertimetable = async (req, res) => {
    try {
        // Find teacher
        const teacher = await Teacher.findOne({ email: req.user?.email });
        if (!teacher) {
            throw new Apierror(401, "Teacher not found");
        }

        // Get current day
        const todayDay = dayjs().format("dddd");
        console.log("Getting timetable for teacher:", teacher.empId, "Day:", todayDay);

        // Get all entries for this teacher from all timetables
        const timetables = await Timetable.find({
            "entries.empId": teacher.empId,
            "entries.day": todayDay
        });

        let todayClasses = [];

        // Extract only this teacher's classes
        timetables.forEach(tt => {
            if (tt.entries && Array.isArray(tt.entries)) {
                const teacherClasses = tt.entries
                    .filter(entry =>
                        entry.empId === teacher.empId &&
                        entry.day === todayDay &&
                        entry.subject !== "Lunch Break"
                    )
                    .map(entry => ({
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        subject: entry.subject,
                        subjectCode: entry.subjectCode || entry.subject, // Use subjectCode if available, fallback to subject
                        room: entry.room || 'TBA'
                    }));

                todayClasses.push(...teacherClasses);
            }
        });

        // Sort classes by start time
        todayClasses.sort((a, b) => {
            const timeA = a.startTime.split(':').map(Number);
            const timeB = b.startTime.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        console.log("Found classes:", JSON.stringify(todayClasses, null, 2));

        return res.json(new Apiresponse(200, {
            date: dayjs().format("YYYY-MM-DD"),
            day: todayDay,
            teacherId: teacher.empId,
            teacherName: teacher.name,
            totalClasses: todayClasses.length,
            classes: todayClasses
        }, "Teacher timetable fetched successfully"));
    } catch (error) {
        console.error("Error in getteachertimetable:", error);
        return res.status(error.code || 500).json(
            new Apierror(error.code || 500, error.message || "Internal server error")
        );
    }

}

export {
    getteachertimetable
}