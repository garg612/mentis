import { asyncHandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/Apierror.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.models.js";
import { Teacher } from "../models/teacher.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";

// Generate tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
  if (!user) throw new Apierror(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
  throw new Apierror(500, "Failed to generate access and refresh token");
  };
};

// Register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if ([name, email, password, role].some((field) => !field || field.trim() === "")) {
    throw new Apierror(401, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Apierror(401, "User already exists");

  let user;
  try {
    user = await User.create({ name, email, password, role });
  } catch (error) {
    console.log("User creation failed", error);
    throw new Apierror(500, "User creation failed");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) throw new Apierror(500, "Something went wrong while fetching created user");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(201)
    .cookie("access_token", accessToken, options)
    .cookie("refresh_token", refreshToken, options)
    .json(new Apiresponse(201, { user: createdUser, accessToken, refreshToken }, "User Registered successfully"));
});

// Login
const LoginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) throw new Apierror(401, "Email, Password, and Role are required");

  const user = await User.findOne({ email,role });
  if (!user) throw new Apierror(401, "User not found");

  const isPasswordValid = await user.ispasswordCorrect(password);
  if (!isPasswordValid) throw new Apierror(401, "Invalid password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  if (!loggedInUser) throw new Apierror(401, "User not found");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("access_token", accessToken, options)
    .cookie("refresh_token", refreshToken, options)
    .json(new Apiresponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refresh_token", options)
    .json(new Apiresponse(200, {}, "User logged out"));
});

// Get Profile
const getProfile = asyncHandler(async (req, res) => {
  const baseUser = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  };


  let extraData = null;
  const email = req.user.email.toLowerCase();

  if (req.user.role === "student") {
    extraData = await Student.findOne({ email });
    console.log("Looking for student with email:", email);
    if (!extraData) throw new Apierror(404, "Student data not found");
  }

  if (req.user.role === "teacher") {
    extraData = await Teacher.findOne({ email });
    if (!extraData) throw new Apierror(404, "Teacher data not found");
  }

  if (extraData.name && extraData.name !== baseUser.name) {
      await User.findByIdAndUpdate(
        req.user._id,
        { name: extraData.name },
        { new: true }
      );
      baseUser.name = extraData.name;
    }

  res.status(200).json(new Apiresponse(200, { baseUser, extraData }, "User profile fetched successfully"));
});

// Update Profile (avatar)
const updateProfile = asyncHandler(async (req, res) => {
  console.log("Updating profile");
  if(req.file) {
    console.log("File uploaded");
  }
  const file = req?.files?.avatar?.[0] || req.file;
  if (!file) throw new Apierror(400, "No image file uploaded");

  let avatarUrl = null;
  const uploadResult = await uploadOnCloudinary(file.path);
  if (uploadResult && uploadResult.url) {
    avatarUrl = uploadResult.url;
  } else {
    // Fallback to serving from local temp if cloud upload failed
    const filename = file.filename || file.path?.split('/').pop();
    avatarUrl = filename ? `/temp/${filename}` : null;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json(new Apiresponse(200, user, "Avatar updated successfully"));
});

// Update Password
const updatepassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) throw new Apierror(404, "User not found");

  const isPasswordValid = await user.ispasswordCorrect(oldPassword);
  if (!isPasswordValid) throw new Apierror(401, "Invalid old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new Apiresponse(200, {}, "Password updated successfully"));
});

export {
  registerUser,
  LoginUser,
  logoutUser,
  getProfile,
  updateProfile,
  updatepassword,
};
