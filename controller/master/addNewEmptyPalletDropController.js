import mongoose from "mongoose";
import EmptyPalletDropLocation from "../../models/master/addNewEmptyPalletDropModel.js";
// Add a new empty pallet drop location
export const addNewEmptyPalletDrop = async (req, res) => {
  const { userId, role } = req.query; // Extract userId and role from query parameters

  console.log(`Received userId: ${userId}, role: ${role}`);

  // Validate userId before proceeding
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  if (!role) {
    return res.status(400).json({ message: "Role is required" });
  }
  const { agv_storage_name, user_storage_name, landmark, position } = req.body;

  try {
    const newEmptyPalletDropLocation = new EmptyPalletDropLocation({
      agv_storage_name,
      user_storage_name,
      landmark,
      position,
      userId,
      role,
    });

    await newEmptyPalletDropLocation.save();
    res
      .status(201)
      .json({
        message: "New empty pallet drop location added successfully",
        data: newEmptyPalletDropLocation,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding new empty pallet drop location", error });
  }
};
// Delete an empty pallet drop location by ID
export const deleteEmptyPalletDrop = async (req, res) => {
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
    const deletedDropLocation = await EmptyPalletDropLocation.findByIdAndDelete(
      id
    );

    if (!deletedDropLocation) {
      return res
        .status(404)
        .json({ message: "Empty pallet drop location not found" });
    }

    res
      .status(200)
      .json({
        message: "Empty pallet drop location deleted successfully",
        data: deletedDropLocation,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting empty pallet drop location", error });
  }
};
// Update an empty pallet drop location by ID
export const editEmptyPalletDrop = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedDropLocation = await EmptyPalletDropLocation.findOneAndUpdate(
      { _id: id },
      { $set: updateData, userId, role },
      { new: true }
    );

    if (!updatedDropLocation) {
      return res
        .status(404)
        .json({ message: "Empty pallet drop location not found" });
    }

    res.status(200).json({
      message: "Empty pallet drop location updated successfully",
      data: updatedDropLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating empty pallet drop location",
      error,
    });
  }
};
