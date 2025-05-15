import express from "express";
import StorageLocation from "../../models/master/addStorageLocationmodel.js";
import StockModel from "../../models/stockModel/stockModel.js";
import {
  addStorageLocation,
  deleteStorageLocation,
  editStorageLocation,
} from "../../controller/master/addStorageLocationController.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const storageLocationRouter = express.Router();
// Post request to add storage location
storageLocationRouter.post(
  "/addStorageLocation",
  authenticateUser,
  addStorageLocation
);

// Get request to fetch all storage locations with their status and stock details
storageLocationRouter.get("/getAllStorageLocations", async (req, res) => {
  try {
    // Fetch all storage locations with required details
    const allLocations = await StorageLocation.find(
      {},
      {
        user_storage_name: 1,
        status: 1,
        agv_storage_name: 1,
        landmark: 1,
        level: 1,
        warehouse: 1,
        _id: 1,
      }
    );

    // Fetch all occupied stock data (FIFO order)
    const occupiedStocks = await StockModel.find({})
      .sort({ createdAt: 1 }) // FIFO ordering (oldest first)
      .select({
        toLoc: 1,
        skuDetails: 1,
        noOfBatches: 1,
        qaStatus: 1,
        createdAt: 1,
        _id: 0,
      });

    // Map to track occupied locations
    const occupiedMap = {};
    occupiedStocks.forEach((stock) => {
      if (!occupiedMap[stock.toLoc]) {
        occupiedMap[stock.toLoc] = {
          skuDetails: stock.skuDetails,
          noOfBatches: stock.noOfBatches,
          qaStatus: stock.qaStatus,
          createdAt: stock.createdAt,
        };
      }
    });

    // Categorizing locations
    const locationStatus = allLocations.map((loc) => {
      // If StorageLocation status is 2 (Frozen), return it with all details
      if (loc.status === 2) {
        return {
          location: loc.user_storage_name,
          status: 2,
          agv_storage_name: loc.agv_storage_name,
          landmark: loc.landmark,
          warehouse: loc.warehouse,
        };
      }

      // Otherwise, check stock presence
      let status = occupiedMap[loc.user_storage_name] ? 1 : 0;

      return {
        location: loc.user_storage_name,
        status,
        _id: loc._id, 
        agv_storage_name: loc.agv_storage_name,
        landmark: loc.landmark,
        level: loc.level,
        warehouse: loc.warehouse,
        ...(status === 1 && {
          // Only add stock details if occupied
          skuDetails: occupiedMap[loc.user_storage_name]?.skuDetails,
          noOfBatches: occupiedMap[loc.user_storage_name]?.noOfBatches,
          qaStatus: occupiedMap[loc.user_storage_name]?.qaStatus,
          storedAt: occupiedMap[loc.user_storage_name]?.createdAt,
        }),
      };
      add;
    });

    res.status(200).json(locationStatus);
  } catch (error) {
    console.error("Error fetching storage locations:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a storage location by ID
storageLocationRouter.delete(
  "/deleteStorageLocationByID",
  authenticateUser,
  deleteStorageLocation
);
// Edit a storage location by ID
storageLocationRouter.put(
  "/editStorageLocation",
  authenticateUser,
  editStorageLocation
);

export default storageLocationRouter;
