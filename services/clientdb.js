import mysql from 'mysql2/promise';

let mysqlPool = null;

export const connectClientDB = async () => {
  if (mysqlPool) {
    // console.log("Reusing existing MySQL connection pool");
    return mysqlPool;
  }

  try {
    // console.log("Creating new MySQL connection pool...");
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log("MySQL connection pool ready");
    return mysqlPool;
  } catch (error) {
    console.error("MySQL connection failed:", error);
    throw error;
  }
};
// import mongoose from "mongoose";
// import mixingSchema from "../models/clientSchemas/mixingSchema.js";

// let clientConnection = null;

// export const connectClientDB = async () => {
//   if (clientConnection && clientConnection.readyState === 1) {
//     console.log("Reusing existing client connection");
//     return clientConnection;
//   }

//   try {
//     console.log("Establishing new client connection...");
//     clientConnection = mongoose.createConnection(process.env.MES_URI, {
//       // useNewUrlParser: true,
//       // useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000
//     });

//     // Wait for connection to be established
//     await clientConnection.asPromise();
    
//     // Register model AFTER connection is ready
//     clientConnection.model("mixing", mixingSchema);
    
//     console.log("Client DB connection ready");
//     return clientConnection;
//   } catch (error) {
//     console.error("Client DB connection failed:", error);
//     throw error; // Rethrow for proper error handling
//   }
// };