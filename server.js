import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http"; // Changed from http to https
import fs from "fs";
import os from "os"; // Import missing os module
import { initializeSocket } from "./config/socket.js";
import checkProductLife from "./middleware/checkProductLife.js";
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoutes/userRoute.js";
import agvRouter from "./routes/agvRoutes/agvRoute.js";
import storageLocationRouter from "./routes/storageRoutes/storageLocationRoute.js";
import skuRoute from "./routes/skuRoutes/skuRoutes.js";
import machinePickUpLocationRouter from "./routes/machinePickUpRoute/machinePickupRoute.js";
import operationRouter from "./routes/operationRoute/operationRoute.js";
import retrievalDropLocationRouter from "./routes/retrievalRoute/retrievalRoute.js";
import emptyPalletPickUpLocationRouter from "./routes/emptyPalletRoute/emptyPalletRoute.js";
import stockRouter from "./routes/stockRoute/stockRoute.js";
import compoundRouter from "./routes/compoundRoutes/addNewCompoundRoute.js";
import clientDataRouter from "./routes/clientRoutes/clientRoute.js";
import { startSyncJob } from "./services/cron.js";
import { SyncService } from "./services/syncService.js";
import {initQualityStatusUpdater} from './middleware/updateStockQualityStatus.js'
import {sendReports,sendMongoDBBackupAsCSV} from './email/email.js' 
// Function to get local IP
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};
// SSL certificate configuration
// const sslOptions = {
//   key: fs.readFileSync('./server.key'),
//   cert: fs.readFileSync('./server.cert')
// };
// App Config
const app = express();
const port = process.env.PORT || 3535;
const server = createServer(app); 
const host = getLocalIP();

// fetchClientData function to handle the initial sync and connection
async function fetchClientData() {
  try {
    // 1. Connect to Main DB
    await connectDB();

    // 2. Create SyncService instance
    const syncService = new SyncService();

    // 3. Perform Initial Sync
    await syncService.performSync();

    // 4. Start Scheduled Syncs
    startSyncJob(syncService);
    // Rest of initialization
    initializeSocket(server);
    // console.log("🚀 All systems go");
  } catch (error) {
    console.error("🔥 fetchClientData failed:", error);
    process.exit(1);
  }
}
// initial fetch client data when server resart only unique will retrive from client when server loss their connection
fetchClientData();
// update quality status in stock every 4 hrs
initQualityStatusUpdater();
// sendReports(); 
// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(checkProductLife);
// API EndPoints
app.use("/api/user", userRouter);
app.use("/api/master/agv", agvRouter);
app.use("/api/master", storageLocationRouter);
app.use("/api/master", retrievalDropLocationRouter);
app.use("/api/master/skuDetails", skuRoute);
app.use("/api/master", machinePickUpLocationRouter);
app.use("/api/operations", operationRouter);
app.use("/api/stockStatus", stockRouter);
app.use("/", emptyPalletPickUpLocationRouter);
app.use("/api/master", compoundRouter);
app.use("/api", clientDataRouter);
// Default Route
app.get("/", (req, res) => {
  res.send("API Working");
});
// Initialize Socket.io Server
initializeSocket(server);
// Start HTTP Server
server.listen(port, () => {
  console.log(`HTTP Server running on http://${host}:${port}`);
});

// import express from "express";
// import cors from "cors";
// import "dotenv/config";
// import { createServer } from "https"; // Changed from http to https
// import os from 'os';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { initializeSocket } from './config/socket.js';
// import checkProductLife from "./middleware/checkProductLife.js";
// import connectDB from "./config/mongodb.js";
// import userRouter from "./routes/userRoutes/userRoute.js";
// import agvRouter from "./routes/agvRoutes/agvRoute.js";
// import storageLocationRouter from "./routes/storageRoutes/storageLocationRoute.js";
// import skuRoute from "./routes/skuRoutes/skuRoutes.js";
// import machinePickUpLocationRouter from "./routes/machinePickUpRoute/machinePickupRoute.js";
// import operationRouter from "./routes/operationRoute/operationRoute.js";
// import retrievalDropLocationRouter from "./routes/retrievalRoute/retrievalRoute.js";
// import emptyPalletPickUpLocationRouter from "./routes/emptyPalletRoute/emptyPalletRoute.js";
// import stockRouter from "./routes/stockRoute/stockRoute.js";
// import compoundRouter from "./routes/compoundRoutes/addNewCompoundRoute.js";
// import clientDataRouter from "./routes/clientRoutes/clientRoute.js";
// import { startSyncJob } from "./services/cron.js";
// import { SyncService } from "./services/syncService.js";
// import {initQualityStatusUpdater} from './middleware/updateStockQualityStatus.js'
// import {sendReports,sendMongoDBBackupAsCSV} from './email/email.js' 
// // Function to get local IP
// const getLocalIP = () => {
//   const interfaces = os.networkInterfaces();
//   for (const interfaceName in interfaces) {
//     for (const iface of interfaces[interfaceName]) {
//       if (iface.family === "IPv4" && !iface.internal) {
//         return iface.address;
//       }
//     }
//   }
//   return "localhost";
// };
// // SSL certificate configuration
// const sslOptions = {
//   key: fs.readFileSync('./server.key'),
//   cert: fs.readFileSync('./server.cert')
// };
// // App Config
// const app = express();
// const port = process.env.PORT || 3535;
// const server = createServer(app); 
// const host = getLocalIP();

// // fetchClientData function to handle the initial sync and connection
// async function fetchClientData() {
//   try {
//     // 1. Connect to Main DB
//     await connectDB();

//     // 2. Create SyncService instance
//     const syncService = new SyncService();

//     // 3. Perform Initial Sync
//     await syncService.performSync();

//     // 4. Start Scheduled Syncs
//     startSyncJob(syncService);
//     // Rest of initialization
//     initializeSocket(server);
//     // console.log("🚀 All systems go");
//   } catch (error) {
//     console.error("🔥 fetchClientData failed:", error);
//     process.exit(1);
//   }
// }
// // initial fetch client data when server resart only unique will retrive from client when server loss their connection
// fetchClientData();
// // update quality status in stock every 4 hrs
// initQualityStatusUpdater();
// // sendReports(); 
// // Middleware
// app.use(cors({ origin: "*" }));
// app.use(express.json());
// app.use(checkProductLife);
// // API EndPoints
// app.use("/api/user", userRouter);
// app.use("/api/master/agv", agvRouter);
// app.use("/api/master", storageLocationRouter);
// app.use("/api/master", retrievalDropLocationRouter);
// app.use("/api/master/skuDetails", skuRoute);
// app.use("/api/master", machinePickUpLocationRouter);
// app.use("/api/operations", operationRouter);
// app.use("/api/stockStatus", stockRouter);
// app.use("/", emptyPalletPickUpLocationRouter);
// app.use("/api/master", compoundRouter);
// app.use("/api", clientDataRouter);
// // Get __dirname for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Serve Vite React build (Assuming 'dist' is at the root level)
// app.use(express.static(path.join(__dirname, '..', 'dist')));

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
// });

// // Initialize WebSocket Server
// initializeSocket(server);

// // Start HTTP Server (Fixing incorrect 'app.listen' usage)
// server.listen(port, () => {
//     console.log(`Server running at http://wms.test.com:6060`);
// });

// // import express from "express";
// // import cors from "cors";
// // import "dotenv/config";
// // import { createServer } from "https"; // Changed from http to https
// // import fs from "fs";
// // import os from "os"; // Import missing os module
// // import { initializeSocket } from "./config/socket.js";
// // import checkProductLife from "./middleware/checkProductLife.js";
// // import connectDB from "./config/mongodb.js";
// // import userRouter from "./routes/userRoutes/userRoute.js";
// // import agvRouter from "./routes/agvRoutes/agvRoute.js";
// // import storageLocationRouter from "./routes/storageRoutes/storageLocationRoute.js";
// // import skuRoute from "./routes/skuRoutes/skuRoutes.js";
// // import machinePickUpLocationRouter from "./routes/machinePickUpRoute/machinePickupRoute.js";
// // import operationRouter from "./routes/operationRoute/operationRoute.js";
// // import retrievalDropLocationRouter from "./routes/retrievalRoute/retrievalRoute.js";
// // import emptyPalletPickUpLocationRouter from "./routes/emptyPalletRoute/emptyPalletRoute.js";
// // import stockRouter from "./routes/stockRoute/stockRoute.js";
// // import compoundRouter from "./routes/compoundRoutes/addNewCompoundRoute.js";
// // import clientDataRouter from "./routes/clientRoutes/clientRoute.js";
// // import { startSyncJob } from "./services/cron.js";
// // import { SyncService } from "./services/syncService.js";
// // import {initQualityStatusUpdater} from './middleware/updateStockQualityStatus.js'
// // import {sendReports,sendMongoDBBackupAsCSV} from './email/email.js' 
// // // Function to get local IP
// // const getLocalIP = () => {
// //   const interfaces = os.networkInterfaces();
// //   for (const interfaceName in interfaces) {
// //     for (const iface of interfaces[interfaceName]) {
// //       if (iface.family === "IPv4" && !iface.internal) {
// //         return iface.address;
// //       }
// //     }
// //   }
// //   return "localhost";
// // };
// // // SSL certificate configuration
// // const sslOptions = {
// //   key: fs.readFileSync('./server.key'),
// //   cert: fs.readFileSync('./server.cert')
// // };
// // // App Config
// // const app = express();
// // const port = process.env.PORT || 3535;
// // const server = createServer(sslOptions, app); 
// // const host = getLocalIP();

// // // fetchClientData function to handle the initial sync and connection
// // async function fetchClientData() {
// //   try {
// //     // 1. Connect to Main DB
// //     await connectDB();

// //     // 2. Create SyncService instance
// //     const syncService = new SyncService();

// //     // 3. Perform Initial Sync
// //     await syncService.performSync();

// //     // 4. Start Scheduled Syncs
// //     startSyncJob(syncService);
// //     // Rest of initialization
// //     initializeSocket(server);
// //     // console.log("🚀 All systems go");
// //   } catch (error) {
// //     console.error("🔥 fetchClientData failed:", error);
// //     process.exit(1);
// //   }
// // }
// // // initial fetch client data when server resart only unique will retrive from client when server loss their connection
// // fetchClientData();
// // // update quality status in stock every 4 hrs
// // initQualityStatusUpdater();

// // // Middleware
// // app.use(cors({ origin: "*" }));
// // app.use(express.json());
// // app.use(checkProductLife);
// // // API EndPoints
// // app.use("/api/user", userRouter);
// // app.use("/api/master/agv", agvRouter);
// // app.use("/api/master", storageLocationRouter);
// // app.use("/api/master", retrievalDropLocationRouter);
// // app.use("/api/master/skuDetails", skuRoute);
// // app.use("/api/master", machinePickUpLocationRouter);
// // app.use("/api/operations", operationRouter);
// // app.use("/api/stockStatus", stockRouter);
// // app.use("/", emptyPalletPickUpLocationRouter);
// // app.use("/api/master", compoundRouter);
// // app.use("/api", clientDataRouter);
// // // Default Route
// // app.get("/", (req, res) => {
// //   res.send("API Working");
// // });
// // // Initialize Socket.io Server
// // initializeSocket(server);
// // // Start HTTP Server
// // server.listen(port, () => {
// //   console.log(`HTTPS Server running on https://${host}:${port}`);
// // });
