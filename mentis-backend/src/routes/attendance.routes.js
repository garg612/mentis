import { Router } from "express";
import { 
    generateQr,
    markAttendence,
    getMyAttendanceStats
 } from "../controllers/attendence.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router=Router();

router.route("/generate").post(verifyJWT,generateQr);
router.route("/mark").post(verifyJWT,markAttendence);
router.route("/myattendance").get(verifyJWT,getMyAttendanceStats);

export default router;