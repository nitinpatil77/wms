import cron from "node-cron";
import { exec } from "child_process";
import nodemailer from "nodemailer";
import { Parser } from "json2csv";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/stockModel/stockModel.js";
import OperationHistory from "../models/operatonModel/OperationHistory .js";
import compoundModel from "../models/master/addNewCompoundModel.js";
import EmptyPalletDropLocation from "../models/master/addNewEmptyPalletDropModel.js";
import EmptyPalletPickUpLocation from "../models/master/addNewEmptyPalletPickUpModel.js";
import MachinePickUpLocation from "../models/master/addNewMachinePickupLcationsModel.js";
import RetrievalDropLocation from "../models/master/addNewRetrievalDropLocationModel.js";
import StorageLocation from "../models/master/addStorageLocationmodel.js";
import agvModel from "../models/master/agvModel.js";
import ManualRetrieval from "../models/operatonModel/manualOperation.js";
import RobotErrorLog from "../models/agvLogModel/robotErrorLoggerModel.js";
import RobotWaitLog from "../models/agvLogModel/robotWaitLoggerModel.js";
import userModel from "../models/userModel/userModel.js";
dotenv.config();

// Email transporter configuration (fill your details)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
//  New: Shift Window Helper
const getShiftWindow = (shift) => {
  const now = new Date();
  let startTime, endTime;

  // Convert shift to uppercase for case-insensitive comparison
  switch (shift.toUpperCase()) {
    case "C":
      // Shift C: 17:00 UTC (previous day) to 01:00 UTC (current day)
      startTime = new Date(now);
      startTime.setUTCHours(17, 0, 0, 0);
      startTime.setDate(startTime.getDate() - 1);
      endTime = new Date(now);
      endTime.setUTCHours(1, 0, 0, 0);
      break;
    case "A":
      // Shift A: 01:00 UTC to 09:00 UTC
      startTime = new Date(now);
      startTime.setUTCHours(1, 0, 0, 0);
      endTime = new Date(now);
      endTime.setUTCHours(9, 0, 0, 0);
      break;
    case "B":
      // Shift B: 09:00 UTC to 17:00 UTC
      startTime = new Date(now);
      startTime.setUTCHours(9, 0, 0, 0);
      endTime = new Date(now);
      endTime.setUTCHours(17, 0, 0, 0);
      break;
    default:
      // Fallback to current shift determination
      console.warn(
        `Invalid shift identifier (${shift}), using current shift detection`
      );
      return getShiftWindow(getCurrentShift());
  }

  return { startTime, endTime };
};

// Get current shift identifier
const getCurrentShift = () => {
  const now = new Date();
  const istHours = (now.getUTCHours() + 5.5) % 24;

  if (istHours >= 6.5 && istHours < 14.5) return "A";
  if (istHours >= 14.5 && istHours < 22.5) return "B";
  return "C";
};
// Stock Report Generation Function
const generateStockReportByQAStatus = async (qaStatus, startTime, endTime) => {
  try {
    const stockData = await Stock.find({
      updatedAt: { $gte: startTime, $lte: endTime },
      qaStatus: qaStatus,
    }).lean();

    const fields = [
      "operationId",
      "batch",
      "skuDetails",
      "fromLoc",
      "toLoc",
      "qaStatus",
      "warehouse",
      "compoundAge",
      "createdAt",
      "updatedAt",
    ];

    const parser = new Parser({ fields });
    return {
      filename: `stock-report-${qaStatus}.csv`,
      data: parser.parse(stockData),
      content: `Stock Report [${qaStatus}] (Updated between ${startTime.toISOString()} and ${endTime.toISOString()}): ${
        stockData.length
      } records found`,
    };
  } catch (error) {
    console.error(`Stock report error for qaStatus ${qaStatus}:`, error);
    throw error;
  }
};
// Function to generate AGV Report by Status
const generateAGVReportByStatus = async (status, startTime, endTime) => {
  try {
    const agvData = await OperationHistory.find({
      updatedAt: { $gte: startTime, $lte: endTime },
      status: status,
    }).lean();

    const fields = [
      "operationId",
      "operationType",
      "fromLoc",
      "toLoc",
      "noOfBatches",
      "duration",
      "status",
      "startedAt",
      "completedAt",
      "createdAt",
    ];

    const parser = new Parser({ fields });
    return {
      filename: `agv-report-${status}.csv`,
      data: parser.parse(agvData),
      content: `AGV Report [${status}] (Completed between ${startTime.toISOString()} and ${endTime.toISOString()}): ${
        agvData.length
      } operations`,
    };
  } catch (error) {
    console.error(`AGV report error for status ${status}:`, error);
    throw error;
  }
};
// Function to generate MongoDB backup as CSV file
const generateCSVBackupVirtual = async () => {
  try {
    const collections = [
      { name: "stock", data: await Stock.find({}).lean() },
      {
        name: "operation-history",
        data: await OperationHistory.find({}).lean(),
      },
      { name: "compound", data: await compoundModel.find({}).lean() },
      {
        name: "empty-pallet-drop",
        data: await EmptyPalletDropLocation.find({}).lean(),
      },
      {
        name: "empty-pallet-pickup",
        data: await EmptyPalletPickUpLocation.find({}).lean(),
      },
      {
        name: "machine-pickup",
        data: await MachinePickUpLocation.find({}).lean(),
      },
      {
        name: "retrieval-drop",
        data: await RetrievalDropLocation.find({}).lean(),
      },
      { name: "storage-location", data: await StorageLocation.find({}).lean() },
      { name: "agv", data: await agvModel.find({}).lean() },
      { name: "manual-retrieval", data: await ManualRetrieval.find({}).lean() },
      { name: "robot-error", data: await RobotErrorLog.find({}).lean() },
      { name: "robot-wait", data: await RobotWaitLog.find({}).lean() },
      { name: "user", data: await userModel.find({}).lean() },
    ];

    const today = new Date().toISOString().split("T")[0];
    const backups = [];

    for (const collection of collections) {
      if (collection.data.length === 0) {
        console.log(`Skipping ${collection.name} - No data found.`);
        continue;
      }

      const parser = new Parser(); // automatically infers fields
      const csv = parser.parse(collection.data);

      backups.push({
        filename: `${collection.name}-backup-${today}.csv`,
        content: csv,
      });
    }

    return backups;
  } catch (error) {
    console.error("Error generating CSV backups:", error);
    throw error;
  }
};
// const generateCSVBackupVirtual = async () => {
//   try {
//     const updatedSince = new Date(Date.now() - 8 * 60 * 60 * 1000); // last 8 hours

//     const collections = [
//       { name: "stock", data: () => Stock.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "operation-history", data: () => OperationHistory.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "compound", data: () => compoundModel.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "empty-pallet-drop", data: () => EmptyPalletDropLocation.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "empty-pallet-pickup", data: () => EmptyPalletPickUpLocation.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "machine-pickup", data: () => MachinePickUpLocation.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "retrieval-drop", data: () => RetrievalDropLocation.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "storage-location", data: () => StorageLocation.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "agv", data: () => agvModel.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "manual-retrieval", data: () => ManualRetrieval.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "robot-error", data: () => RobotErrorLog.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "robot-wait", data: () => RobotWaitLog.find({ updatedAt: { $gte: updatedSince } }).lean() },
//       { name: "user", data: () => userModel.find({ updatedAt: { $gte: updatedSince } }).lean() },
//     ];

//     const today = new Date().toISOString().split("T")[0];
//     const backups = [];

//     for (const collection of collections) {
//       const records = await collection.data();

//       if (records.length === 0) {
//         console.log(`Skipping ${collection.name} - No recent updates.`);
//         continue;
//       }

//       const parser = new Parser();
//       const csv = parser.parse(records);

//       backups.push({
//         filename: `${collection.name}-backup-${today}.csv`,
//         content: csv,
//       });
//     }

//     return backups;
//   } catch (error) {
//     console.error("Error generating CSV backups:", error);
//     throw error;
//   }
// };

// Function to send all collection backup in one email
export const sendMongoDBBackupAsCSV = async () => {
  try {
    const backups = await generateCSVBackupVirtual();

    const mailOptions = {
      from: `Automated Daily Database CSV Backup <${process.env.EMAIL_USER}>`,
      to: process.env.BACKUP_RECIPIENT,
      subject: `Daily Database Backup CSV Backup - ${new Date().toLocaleDateString()}`,
      text: `Attached are the latest MongoDB collection backups in CSV format.`,
      attachments: backups.map((backup) => ({
        filename: backup.filename,
        content: backup.content,
      })),
    };

    await transporter.sendMail(mailOptions);
    console.log("MongoDB CSV backups email sent successfully");
  } catch (error) {
    console.error("Error sending MongoDB CSV backups email:", error);
  }
};
// Function to send all reports in one email
// export const sendReports = async () => {
//   try {
//     const qaStatuses = ["ok", "Hold", "reject", "overAgeAlert", "overage"];
//     const agvStatuses = ["FINISHED", "STOPPED"];
//     const attachments = [];

//      // Get current time in IST
//     const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//     const hour = nowIST.getHours();
//     const minute = nowIST.getMinutes();

//     // Determine shift with tolerance window
//     let shift;
//     if ((hour === 6 && minute >= 40) || (hour === 7 && minute < 40)) {
//       shift = 'C';
//     } else if ((hour === 14 && minute >= 40) || (hour === 15 && minute < 40)) {
//       shift = 'A';
//     } else if ((hour === 22 && minute >= 40) || (hour === 23 && minute < 40)) {
//       shift = 'B';
//     } else {
//       shift = getCurrentShift();
//       console.log(`Falling back to current shift detection: ${shift}`);
//     }

//     const { startTime, endTime } = getShiftWindow(shift);
//     // Generate reports
//     for (const qaStatus of qaStatuses) {
//       const report = await generateStockReportByQAStatus(qaStatus, startTime, endTime);
//       attachments.push({ filename: report.filename, content: report.data });
//     }

//     for (const agvStatus of agvStatuses) {
//       const report = await generateAGVReportByStatus(agvStatus, startTime, endTime);
//       attachments.push({ filename: report.filename, content: report.data });
//     }

//     // Format readable time
//     const formattedTime = nowIST.toLocaleString("en-IN", {
//       day: "numeric",
//       month: "numeric",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: true,
//     });

//     // Send email
//     await transporter.sendMail({
//       from: `Savira AGV Reports <${process.env.EMAIL_USER}>`,
//       to: process.env.RECIPIENT_EMAIL,
//       subject: `AGV WMS ${shift} Shift Reports - ${formattedTime}`,
//       attachments,
//     });

//     console.log(`Shift ${shift} reports sent at ${formattedTime}`);
//   } catch (error) {
//     console.error("Report error:", error);
//   }
// };
export const sendReports = async () => {
  try {
    const qaStatuses = ["ok", "Hold", "reject", "overAgeAlert", "overage"];
    const agvStatuses = ["FINISHED", "STOPPED"];
    const attachments = [];

    // Get current time in IST
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const hour = nowIST.getHours();
    const minute = nowIST.getMinutes();

    // Determine shift with tolerance window
    let shift;
    if ((hour === 6 && minute >= 40) || (hour === 7 && minute < 40)) {
      shift = "C";
    } else if ((hour === 14 && minute >= 40) || (hour === 15 && minute < 40)) {
      shift = "A";
    } else if ((hour === 22 && minute >= 40) || (hour === 23 && minute < 40)) {
      shift = "B";
    } else {
      shift = getCurrentShift();
      console.log(`Falling back to current shift detection: ${shift}`);
    }

    const { startTime, endTime } = getShiftWindow(shift);
    console.log(startTime, endTime);

    // Generate reports
    for (const qaStatus of qaStatuses) {
      const report = await generateStockReportByQAStatus(
        qaStatus,
        startTime,
        endTime
      );
      attachments.push({ filename: report.filename, content: report.data });
    }

    for (const agvStatus of agvStatuses) {
      const report = await generateAGVReportByStatus(
        agvStatus,
        startTime,
        endTime
      );
      attachments.push({ filename: report.filename, content: report.data });
    }

    // Get QA Status Counts
    const qaSummary = await Stock.aggregate([
      {
        $match: {
          updatedAt: { $gte: startTime, $lte: endTime },
          qaStatus: { $in: qaStatuses },
        },
      },
      {
        $group: {
          _id: "$qaStatus",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log(qaSummary)
    // Get Operation Type Counts
    const operationSummary = await OperationHistory.aggregate([
      {
        $match: {
          updatedAt: { $gte: startTime, $lte: endTime },
          status: { $in: ["FINISHED", "STOPPED"] },
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            operationType: "$operationType",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Corrected Aggregations
    const errorStats = await RobotErrorLog.aggregate([
      {
        $match: {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      },
      {
        $group: {
          _id: null,
          totalTimeLoss: { $sum: "$duration" }, // Sum of "duration" field
        },
      },
    ]);

    const waitStats = await RobotWaitLog.aggregate([
      {
         $match: {
          startTime: { $gte: startTime },
          endTime: {  $lte: endTime },
        },
      },
      {
        $group: {
          _id: null,
          totalWaitTime: { $sum: "$totalTime" },
          numberOfWaits: { $sum: 1 },
        },
      },
    ]);

    const msToHMM = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    const minutesToHMM = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      return `${hours}h ${minutes}m`;
    };
    // Format counts into readable structure
    const counts = {
      qa: Object.fromEntries(
        qaSummary.map((item) => [item._id.toLowerCase(), item.count])
      ),
      operations: {
        finished: {
          storage:
            operationSummary.find(
              (item) =>
                item._id.status === "FINISHED" &&
                item._id.operationType === "STORAGE"
            )?.count || 0,
          retrieval:
            operationSummary.find(
              (item) =>
                item._id.status === "FINISHED" &&
                item._id.operationType === "RETRIEVAL"
            )?.count || 0,
          emptyStorage:
            operationSummary.find(
              (item) =>
                item._id.status === "FINISHED" &&
                item._id.operationType === "EmptyStorage"
            )?.count || 0,
        },
        stopped: operationSummary
          .filter((item) => item._id.status === "STOPPED")
          .reduce((sum, item) => sum + item.count, 0),
      },
      totalTimeLoss: (errorStats[0]?.totalTimeLoss || 0).toFixed(2),
      totalWaitTime: (waitStats[0]?.totalWaitTime || 0).toFixed(2),
      numberOfWaits: waitStats[0]?.numberOfWaits || 0,
    };

    // Create HTML email body
    const emailBody = `
      <h2>AGV WMS ${shift} Shift Summary</h2>
      
      <h3>Stock Details:</h3>
      <ul>
        <li>OK: ${counts.qa.ok || 0}</li>
        <li>Hold: ${counts.qa.hold || 0}</li>
        <li>Reject: ${counts.qa.reject || 0}</li>
        <li>Over Age Alert: ${counts.qa.overagealert || 0}</li>
        <li>Overage Stock: ${counts.qa.overage || 0}</li>
      </ul>

      <h3>Operations Summary:</h3>
      <h4>Total Completed Tasks:</h4>
      <ul>
        <li>Storage: ${counts.operations.finished.storage}</li>
        <li>Retrieval: ${counts.operations.finished.retrieval}</li>
        <li>Empty Storage: ${counts.operations.finished.emptyStorage}</li>
      </ul>
      <h4>Total Terminated Tasks: ${counts.operations.stopped}</h4>
      <h4>AGV Ideal Waiting and Error DownTime</h4>
       <ul>
        <li>Total Error Downtime: ${msToHMM(counts.totalTimeLoss)}</li>
        <li>Total Waiting Time: ${minutesToHMM(counts.totalWaitTime)}</li>
      </ul>
      </table>
    `;

    // Format readable time for subject
    const formattedTime = nowIST.toLocaleString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Send email
    await transporter.sendMail({
      from: `Savira AGV Reports <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: `AGV WMS ${shift} Shift Reports - ${formattedTime}`,
      attachments,
      html: emailBody,
    });

    console.log(`Shift ${shift} reports sent at ${formattedTime}`);
  } catch (error) {
    console.error("Report error:", error);
  }
};
// Schedule Reports (6:40 AM, 2:40 PM, 10:40 PM IST)
cron.schedule("40 6,14,22 * * *", sendReports, {
  scheduled: true,
  timezone: "Asia/Kolkata",
});

// Daily Backup at 1:00 AM IST
cron.schedule("0 1 * * *", sendMongoDBBackupAsCSV, {
  scheduled: true,
  timezone: "Asia/Kolkata",
});
