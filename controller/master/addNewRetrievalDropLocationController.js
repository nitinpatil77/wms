import mongoose from "mongoose";
import RetrievalDropLocation from "../../models/master/addNewRetrievalDropLocationModel.js";
export const addNewRetrievalDropLocation = async (req, res) => {
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

    const newRetrievalDropLocation = new RetrievalDropLocation({
      agv_storage_name,
      user_storage_name,
      landmark,
      position,
      userId,
      role,
    });

    await newRetrievalDropLocation.save();

    res.status(201).json({
      success: true,
      message: "New retrieval drop location added successfully",
      data: newRetrievalDropLocation,
    });
  } catch (error) {
    console.error("Error adding retrieval drop location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add retrieval drop location",
      error: error.message,
    });
  }
};

// Delete an Retrieval drop location by ID
export const deleteRetrievalDropLocation = async (req, res) => {
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
    const deletedRetrievalDropLocation =
      await RetrievalDropLocation.findByIdAndDelete(id);

    if (!deletedRetrievalDropLocation) {
      return res
        .status(404)
        .json({ message: "Retrieval Drop location not found" });
    }
    res.status(200).json({
      message: "Retrieval Drop location deleted successfully",
      data: deletedRetrievalDropLocation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting Retrieval Drop location", error });
  }
};
// Update an Retrieval drop location by ID
export const editRetrievalDropLocation = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedRetrievalDropLocation =
      await RetrievalDropLocation.findOneAndUpdate(
        { _id: id },
        { $set: updateData, userId, role },
        { new: true }
      );

    if (!updatedRetrievalDropLocation) {
      return res
        .status(404)
        .json({ message: "Retrieval Drop location not found" });
    }

    res.status(200).json({
      message: "Retrieval Drop location updated successfully",
      data: updatedRetrievalDropLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Retrieval Drop location",
      error,
    });
  }
};