import mongoose from "mongoose";

const RobotWaitSchema = new mongoose.Schema({
  // agvId: String,       
  // // parkingPoint: String, 
  startTime: Date,    
  endTime: Date,   
  totalTime: Number,   
});

// Create Model
const RobotWaitLog = mongoose.model("RobotWaitLog", RobotWaitSchema);

export default RobotWaitLog;
