import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import {
    registerUser,
    LoginUser,
    logoutUser,
    getProfile,
    updateProfile,
    updatepassword
}from "../controllers/user.controller.js"

const router=Router();

// Health check endpoint
router.route("/health").get((req, res) => {
    res.status(200).json({ 
        status: "OK", 
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

router.route("/register").post(registerUser);
router.route("/login").post(LoginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/me").get(verifyJWT,getProfile);
router.route("/updatepassword").post(verifyJWT,updatepassword);
router.route("/addavatar").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
    ]),verifyJWT,updateProfile
)

export default router


