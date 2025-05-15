import { connectClientDB } from "./clientdb.js";
import ClientBeforeQaCheck from "../models/clientDataModel/clientBeforeQaCheckModel.js";
import {
  transformData,
  validateDocuments,
  chunkArray,
} from "../utlis/helper.js";

export class SyncService {
  constructor() {
    this.lastSyncTime = null;
  }

  async performSync() {
    const pool = await connectClientDB();
    const connection = await pool.getConnection();
    let newDataCount = 0;

    try {
      // Part 1: Sync new data from MySQL to MongoDB
      let initialQuery = 'SELECT * FROM agv_interface WHERE insap = 0';
      const queryParams = [];
      
      if (this.lastSyncTime) {
        initialQuery += ' AND created_at > ?';
        queryParams.push(this.lastSyncTime);
      }

      const [newRows] = await connection.query(initialQuery, queryParams);
      
      if (newRows.length > 0) {
        // Transform data mapping qrcode to batch
        const transformed = transformData(newRows.map(row => ({
          ...row,
          // Map MySQL qrcode to MongoDB batch
          batch: row.qrcode
        })));

        const validDocs = validateDocuments(transformed);

        // Check for existing batches (qrcodes) in MongoDB
        const existingBatches = await ClientBeforeQaCheck.find({
          batch: { $in: validDocs.map(d => d.batch) }
        }).distinct('batch');

        const newData = validDocs.filter(d => 
          !existingBatches.includes(d.batch)
        );

        if (newData.length > 0) {
          const chunks = chunkArray(newData, 500);
          for (const chunk of chunks) {
            await ClientBeforeQaCheck.insertMany(chunk, { ordered: false });
          }
          newDataCount = newData.length;
        }

        // Update MySQL using qrcode
        const qrcodes = newRows.map(row => row.qrcode);
        await connection.query(
          'UPDATE agv_interface SET insap = 1 WHERE qrcode IN (?)',
          [qrcodes]
        );

        this.lastSyncTime = newRows[newRows.length - 1].created_at;
      }

      // Part 2: Sync approved status using qrcode-batch relationship
      const [approvedRows] = await connection.query(
        `SELECT qrcode 
         FROM agv_interface 
         WHERE quality_status = 'approve' 
           AND insap = 2`
      );

      if (approvedRows.length > 0) {
        // Extract qrcodes to use as MongoDB batch values
        const batches = approvedRows.map(row => row.qrcode);

        // Update MongoDB using qrcode as batch identifier
        const updateResult = await ClientBeforeQaCheck.updateMany(
          { batch: { $in: batches } },
          { $set: { 
            quality_status: "approve" } }
        );

        // Update MySQL to mark as fully processed
        const approvedQrcodes = approvedRows.map(row => row.qrcode);
        await connection.query(
          'UPDATE agv_interface SET insap = 3 WHERE qrcode IN (?)',
          [approvedQrcodes]
        );
      }

      return newDataCount;

    } finally {
      connection.release();
    }
  }
}
// import mongoose from "mongoose";
// import { connectClientDB } from "./clientdb.js";
// import ClientBeforeQaCheck from "../models/clientDataModel/clientBeforeQaCheckModel.js";
// import { transformData } from "../utlis/helper.js";
// export class SyncService {
//   constructor() {
//     this.lastSyncTime = null;
//   }

//   async performSync() {
//     const clientDB = await connectClientDB();
//     const MixingModel = clientDB.model("mixing");
//     let newData = []; // Initialize here

//     const query = this.lastSyncTime
//       ? { _id: { $gt: new mongoose.Types.ObjectId(this.lastSyncTime) } }
//       : {};

//     const clientData = await MixingModel.find(query)
//       .sort({ _id: 1 })
//       .lean();

//     if (clientData.length > 0) {
//       const transformed = transformData(clientData);

//       // Get existing batches
//       const existingBatches = await ClientBeforeQaCheck.find({
//         batch: { $in: transformed.map(d => d.batch) }
//       }).distinct('batch');

//       // Filter out duplicates
//       newData = transformed.filter(d =>
//         !existingBatches.includes(d.batch)
//       );

//       if (newData.length > 0) {
//         const operations = newData.map(doc => ({
//           updateOne: {
//             filter: { batch: doc.batch },
//             update: { $setOnInsert: doc },
//             upsert: true
//           }
//         }));

//         await ClientBeforeQaCheck.bulkWrite(operations, { ordered: false });
//       }

//       this.lastSyncTime = clientData[clientData.length - 1]._id.toString();
//     }

//     return newData.length; // Now safely accessible
//   }
// }