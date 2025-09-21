import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
      getteachertimetable
,
} from "../controllers/teachertimetable.controllers.js";

const router=Router();

router.route("/teachertimetable").get(verifyJWT,getteachertimetable
);

export default router;