// import mongoose from "mongoose";
// const axios = require("axios");
// import WebSocket from "ws";
// const { processRobotErrors } = require("../models/agvLogModel/robotErrorLogger.js");
// const { processWaitingTime } = require("../models/agvLogModel/robotWaitLogger.js");

// const MONGO_URI = "mongodb://localhost:27017/agv"; 
// // Connect to MongoDB
// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.error("❌ MongoDB Connection Error:", err));

// // WebSocket Connection
// const ws = new WebSocket("ws://192.168.40.21:8089/robotsStatus");

// ws.on("open", () => console.log("✅ WebSocket Connected to AGV"));
// ws.on("message", async (message) => {
//   try {
//     const data = JSON.parse(message);
//     if (!data || !data.report || data.report.length === 0) return;

//     const agvData = data.report[0];

//     // Process Robot Errors
//     await processRobotErrors(agvData);

//     // Process AGV Waiting Time
//     await processWaitingTime(agvData);

//   } catch (error) {
//     console.error("❌ Error Processing WebSocket Data:", error.message);
//   }
// });

// ws.on("close", () => console.log("❌ WebSocket Disconnected. Reconnecting..."));
// ws.on("error", (err) => console.error("❌ WebSocket Error:", err.message));
