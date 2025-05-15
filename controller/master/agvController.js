import mongoose from "mongoose";
import agvModel from "../../models/master/agvModel.js";

// Create AGV
export const createAGV = async (req, res) => {
  try {
    const { userId, role } = req.query;
    const { agvId, agvName, status } = req.body;

    console.log(`Received userId: ${userId}, role: ${role}`);

    // Validate userId before proceeding
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const newAGV = new agvModel({
      agvId,
      agvName,
      status,
      userId: new mongoose.Types.ObjectId(userId),
      role,
    });

    await newAGV.save();

    res
      .status(201)
      .json({ message: "AGV registered successfully", agv: newAGV });
  } catch (error) {
    console.error("Error registering AGV:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
// Get All AGVs
export const getAllAGVs = async (req, res) => {
  try {
    const { userId, role } = req.query;

    console.log(`User ${userId} with role ${role} is fetching AGV details`);

    const agvs = await agvModel.find();
    res.status(200).json(agvs);
  } catch (error) {
    console.error("Error fetching AGVs:", error);
    res.status(500).json({ message: "Error fetching AGVs", error });
  }
};
// Delete an AGV Details by ID
export const deleteAGVDetails = async (req, res) => {
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
    const deletedAgv = await agvModel.findByIdAndDelete(id);

    if (!deletedAgv) {
      return res.status(404).json({ message: "AGV Details not found" });
    }
    res.status(200).json({
      message: "AGV Details deleted successfully",
      data: deletedAgv,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting AGV Details", error });
  }
};
// Update an AGV Details by ID
export const editAgvDetails = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedAgvDetails = await agvModel.findOneAndUpdate(
      { _id: id },
      { $set: updateData, userId, role },
      { new: true }
    );

    if (!updatedAgvDetails) {
      return res.status(404).json({ message: "AGV Details not found" });
    }

    res.status(200).json({
      message: "AGV Details updated successfully",
      data: updatedAgvDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating AGV Details",
      error,
    });
  }
};
