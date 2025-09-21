import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getStudentTimetable } from "../controllers/studenttimetable.controller.js";

const router =Router();

router.route("/timetable").get(verifyJWT,getStudentTimetable);

export default router;