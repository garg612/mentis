import qrcode from "qrcode";
import { asyncHandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { AttendenceSession } from "../models/attendencesession.models.js";
import { Attendence } from "../models/attendece.models.js";
import { Student } from "../models/student.models.js";

// Helper: calculate distance between two lat/lng in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // radius of earth in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

/**
 * Generate or regenerate QR session
 */
const generateQr = asyncHandler(async (req, res) => {
  const { empId, subject, batchNo, lat, lng } = req.body;

  // check if active session exists
  let session = await AttendenceSession.findOne({ teacherId: empId, subject, batchNo, isActive: true });

  if (!session) {
    session = await AttendenceSession.create({
      teacherId: empId,
      subject,
      batchNo,
      lat,
      lng,
      isActive: true,
      createdAt: Date.now(),
      expireAt: Date.now() + 30 * 1000
    });
  } else {
    // update location if teacher moved
    session.lat = lat;
    session.lng = lng;
    session.expireAt = Date.now() + 30 * 1000;
    await session.save();
  }

  const qrpayload = { sessionId: session._id.toString() };
  const Qrcode = await qrcode.toDataURL(JSON.stringify(qrpayload));
  session.Qrcode = Qrcode;
  await session.save();

  // Auto-close session after expiry
  setTimeout(async () => {
    try {
      const fresh = await AttendenceSession.findById(session._id);
      if (fresh && fresh.isActive && fresh.expireAt <= Date.now()) {
        const allStudents = await Student.find({ batchNo: fresh.batchNo });
        const presentStudents = await Attendence.find({ sessionId: fresh._id }).distinct("studentId");

        const absentStudents = allStudents.filter(s => !presentStudents.includes(s._id.toString()));

        for (let s of absentStudents) {
          await Student.findByIdAndUpdate(s._id, {
            $push: {
              attendanceHistory: {
                subject: fresh.subject,
                date: new Date(),
                status: "Absent"
              }
            }
          });
        }

        fresh.isActive = false;
        await fresh.save();
        console.log(`Session ${fresh._id} auto-closed`);
      }
    } catch (err) {
      console.error("Error auto-closing session:", err.message);
    }
  }, 30 * 1000);

  res.json(new Apiresponse(200, { Qrcode, sessionId: session._id }, "QR code generated successfully"));
});

/**
 * Mark attendance (with location validation)
 */
const markAttendence = asyncHandler(async (req, res) => {
  const { sessionId, lat, lng } = req.body;
  const student = req.user;

  const session = await AttendenceSession.findById(sessionId);
  if (!session || !session.isActive) {
    throw new Apierror(400, "Invalid or inactive session");
  }

  // validate student location
  if (!lat || !lng || !session.lat || !session.lng) {
    throw new Apierror(400, "Location required to mark attendance");
  }
  const distance = calculateDistance(lat, lng, session.lat, session.lng);
  if (distance > 10) {
    throw new Apierror(403, "You are not within range to mark attendance");
  }

  // check duplicate
  const already = await Attendence.findOne({ sessionId, studentId: student._id });
  if (already) {
    throw new Apierror(400, "Attendance already marked");
  }

  await Attendence.create({
    sessionId,
    studentId: student._id,
    name: student.name,
    email: student.email,
    batchNo: student.batchNo,
    subject: session.subject
  });

  await Student.findByIdAndUpdate(student._id, {
    $push: {
      attendanceHistory: {
        subject: session.subject,
        date: new Date(),
        status: "Present"
      }
    }
  });

  res.json(new Apiresponse(200, {}, "Attendance marked successfully"));
});

/**
 * Close session manually
 */
const closeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  const session = await AttendenceSession.findById(sessionId);
  if (!session) throw new Apierror(404, "Session not found");

  const allStudents = await Student.find({ batchNo: session.batchNo });
  const presentStudents = await Attendence.find({ sessionId }).distinct("studentId");

  const absentStudents = allStudents.filter(s => !presentStudents.includes(s._id.toString()));

  for (let s of absentStudents) {
    await Student.findByIdAndUpdate(s._id, {
      $push: {
        attendanceHistory: {
          subject: session.subject,
          date: new Date(),
          status: "Absent"
        }
      }
    });
  }

  session.isActive = false;
  await session.save();

  res.json(new Apiresponse(200, {}, "Session closed and absents marked"));
});

/**
 * Get student’s attendance stats
 */
const getMyAttendanceStats = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ email: req.user.email });
  if (!student) throw new Apierror(404, "Student not found");

  const allRecords = await Attendence.find({ studentId: student._id });
  const allSessions = await AttendenceSession.find({ batchNo: student.batchNo });

  const stats = {};
  for (let session of allSessions) {
    if (!stats[session.subject]) {
      stats[session.subject] = { total: 0, present: 0, absent: 0 };
    }
    stats[session.subject].total += 1;
  }

  for (let record of allRecords) {
    if (stats[record.subject]) {
      stats[record.subject].present += 1;
    }
  }

  for (let subject in stats) {
    stats[subject].absent = stats[subject].total - stats[subject].present;
    stats[subject].percentage =
      stats[subject].total > 0
        ? Math.round((stats[subject].present / stats[subject].total) * 100)
        : 0;
  }

  const absentHistory = student.attendanceHistory.filter(rec => rec.status === "Absent");

  const totalClasses = Object.values(stats).reduce((a, b) => a + b.total, 0);
  const totalPresent = Object.values(stats).reduce((a, b) => a + b.present, 0);
  const overallPercentage =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  res.json(
    new Apiresponse(
      200,
      {
        subjects: stats,
        absentHistory,
        overall: {
          totalClasses,
          totalPresent,
          totalAbsent: totalClasses - totalPresent,
          percentage: overallPercentage
        }
      },
      "Attendance stats fetched"
    )
  );
});

export { generateQr, markAttendence, closeSession, getMyAttendanceStats };
