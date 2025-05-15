import mongoose from "mongoose";
import MachinePickUpLocation from "../../models/master/addNewMachinePickupLcationsModel.js";

// add new machine pick up location
export const addNewMachinePickUpLocation = async (req, res) => {
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

    const { agv_storage_name, user_storage_name, landmark, position } =
      req.body;

    // Create a new machine pick up location
    const newMachinePickUpLocation = new MachinePickUpLocation({
      agv_storage_name,
      user_storage_name,
      landmark,
      position,
      userId,
      role,
    });

    // Save the machine pick up location to the database
    await newMachinePickUpLocation.save();

    res.status(201).json({
      message: "Machine pick up location added successfully",
      data: newMachinePickUpLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding machine pick up location",
      error: error.message,
    });
  }
};

// Delete an empty pallet drop location by ID
export const deleteMachinePickUpLocation = async (req, res) => {
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
    const deletedMachinePickUpLocation =
      await MachinePickUpLocation.findByIdAndDelete(id);

    if (!deletedMachinePickUpLocation) {
      return res
        .status(404)
        .json({ message: "Machine pick up location not found" });
    }
    res.status(200).json({
      message: "Machine pick up location deleted successfully",
      data: deletedMachinePickUpLocation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting machine pick up location", error });
  }
};
// Update an empty pallet drop location by ID
export const editMachinePickUpLocation = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedMachinePickUpLocation =
      await MachinePickUpLocation.findOneAndUpdate(
        { _id: id },
        { $set: updateData, userId, role },
        { new: true }
      );

    if (!updatedMachinePickUpLocation) {
      return res
        .status(404)
        .json({ message: "Machine pick up location not found" });
    }

    res.status(200).json({
      message: "Machine pick up location updated successfully",
      data: updatedMachinePickUpLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating machine pick up location",
      error,
    });
  }
};
