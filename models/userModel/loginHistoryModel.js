import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeName: { type: String, required: true }, // Store employee name
  role: { type: String, required: true }, // Store user role
  loginTime: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

const loginHistoryModel = mongoose.model("LoginHistory", loginHistorySchema);
export default loginHistoryModel;
