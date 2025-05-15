import mongoose from "mongoose";

const RobotErrorSchema = new mongoose.Schema({
  errorCode: { type: String, required: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ["notice", "warning", "error", "fatal"],
    default: "error",
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, 
  operationId: { type: String },
  robotId: { type: String, default: "AGV01" },
  resolved: { type: Boolean, default: false },
  occurrences: { type: Number, default: 1 },
  timestamp: { type: Number }, 
});

// Create Model
const RobotErrorLog = mongoose.model("RobotErrorLog", RobotErrorSchema);

export default RobotErrorLog;
