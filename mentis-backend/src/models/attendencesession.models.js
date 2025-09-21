import mongoose from "mongoose";

const attendenceSessionSchema = new mongoose.Schema({
  teacherId: { type: String, required: true },   // match controller
  subject: { type: String, required: true },
  batchNo: { type: Number, required: true },
  Qrcode: { type: String },                      // match controller
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date },                      // for manual expiry handling
  location: {
    lat: Number,
    lng: Number
  }
});

// Optional TTL index: auto-remove session 30s after expireAt
attendenceSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const AttendenceSession = mongoose.model(
  "AttendenceSession",
  attendenceSessionSchema
);