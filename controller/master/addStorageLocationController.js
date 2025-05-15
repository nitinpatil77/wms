import mongoose from "mongoose";
import StorageLocation from "../../models/master/addStorageLocationmodel.js";

// add new Storage Location
export const addStorageLocation = async (req, res) => {
  try {
    const { userId, role } = req.query; // Extract userId and role from query parameters

    console.log(`Received userId: ${userId}, role: ${role}`);

    // Validate userId before proceeding
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const {
      agv_storage_name,
      level,
      status,
      user_storage_name,
      landmark,
      warehouse,
    } = req.body;
    const newStorageLocation = new StorageLocation({
      agv_storage_name,
      level,
      status,
      user_storage_name,
      landmark,
      warehouse,
      userId,
      role,
    });
    await newStorageLocation.save();
    res.status(201).json({
      message: "Storage Location added successfully",
      data: newStorageLocation,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error adding Storage Location", error: error.message });
  }
};

// Delete an Storage Rack location by ID
export const deleteStorageLocation = async (req, res) => {
  const { id, userId, role } = req.query;

  console.log(`Received id for deletion: ${id}`);

  // Validate the ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID " });
  }
  if (!role && !userId) {
    return res.status(400).json({ message: "User ID and role are required" });
  }
  try {
    const deletedStorageLocation =
      await StorageLocation.findByIdAndDelete(id);

    if (!deletedStorageLocation) {
      return res
        .status(404)
        .json({ message: "Storage Rack location not found" });
    }
    res.status(200).json({
      message: "Storage Rack location deleted successfully",
      data: deletedStorageLocation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting Storage Rack location", error });
  }
};
// Update an Storage Rack location by ID
export const editStorageLocation = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedStorageLocation =
      await StorageLocation.findOneAndUpdate(
        { _id: id },
        { $set: updateData, userId, role },
        { new: true }
      );

    if (!updatedStorageLocation) {
      return res
        .status(404)
        .json({ message: "Storage Rack location not found" });
    }

    res.status(200).json({
      message: "Storage Rack location updated successfully",
      data: updatedStorageLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Storage Rack location",
      error,
    });
  }
};
