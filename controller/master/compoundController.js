import mongoose from "mongoose";
import compoundModel from "../../models/master/addNewCompoundModel.js";

// add new compound
export const addNewCompound = async (req, res) => {
  try {
    const { userId, role } = req.query; // Extract user details from middleware
    const { skuDetails, description, age } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "User ID and role are required" });
    }

    console.log(`Received userId: ${userId}, role: ${role}`);

    const exists = await compoundModel.findOne({ skuDetails });
    if (exists) {
      return res.json({
        success: false,
        message: "Compound Code already exists",
      });
    }

    const newCompound = new compoundModel({
      skuDetails,
      description,
      age,
      userId,
      role,
    });

    await newCompound.save();
    res
      .status(201)
      .json({
        message: "Compound registered successfully",
        compound: newCompound,
      });
  } catch (error) {
    console.error("Error registering compound:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
// get all compounds
export const getAllCompounds = async (req, res) => {
  try {
    const { userId, role } = req.query;

    let query = {};
    if (userId) query.createdBy = userId;

    const compounds = await compoundModel.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: compounds });
  } catch (error) {
    console.error("Error fetching compounds:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
// Delete an Compound (SKU Details) by ID
export const deleteCompound = async (req, res) => {
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
    const deletedCompound = await compoundModel.findByIdAndDelete(id);

    if (!deletedCompound) {
      return res
        .status(404)
        .json({ message: "Compound (SKU Details) not found" });
    }
    res.status(200).json({
      message: "Compound (SKU Details) deleted successfully",
      data: deletedCompound,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting Compound (SKU Details)", error });
  }
};
// Update an Compound (SKU Details) by ID
export const editCompound = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedCompound = await compoundModel.findOneAndUpdate(
      { _id: id },
      { $set: updateData, userId, role },
      { new: true }
    );

    if (!updatedCompound) {
      return res
        .status(404)
        .json({ message: "Compound (SKU Details) not found" });
    }

    res.status(200).json({
      message: "Compound (SKU Details) updated successfully",
      data: updatedCompound,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Compound (SKU Details)",
      error,
    });
  }
};
