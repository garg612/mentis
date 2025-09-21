import cron from "node-cron";
import { AttendenceSession } from "../models/attendencesession.models.js";
import { closeSession } from "../controllers/attendence.controllers.js";

cron.schedule("* * * * *", async () => {
  const expiredSessions = await AttendenceSession.find({
    isActive: true,
    expiresAt: { $lte: new Date() }
  });

  for (let session of expiredSessions) {
    await closeSession(session._id);
  }
});
