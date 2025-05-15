import mongoose from "mongoose";

const robotStatusSchema = new mongoose.Schema({
  operationId: { type: mongoose.Schema.Types.ObjectId, ref: "OperationModel", required: true },
  responseData: { type: Object, required: true }, // Storing full response data
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("RobotStatus", robotStatusSchema);
