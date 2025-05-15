import mongoose from "mongoose";
import EmptyPalletPickUpLocation from "../../models/master/addNewEmptyPalletPickUpModel.js";
export const addNewEmptyPalletPickUp = async (req, res) => {
  const { userId, role } = req.query;
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
    const addNewEmptyPalletPickUpLocation = new EmptyPalletPickUpLocation({
      agv_storage_name,
      user_storage_name,
      landmark,
      position,
      userId,
      role,
    });

    await addNewEmptyPalletPickUpLocation.save();
    res
      .status(201)
      .json({
        message: "New empty pallet PickUp location added successfully",
        data: addNewEmptyPalletPickUpLocation,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error adding new empty pallet PickUp location",
        error,
      });
  }
};

// Delete an empty pallet PickUp location by ID
export const deleteEmptyPalletPickUp = async (req, res) => {
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
    const deletedPickUpLocation =
      await EmptyPalletPickUpLocation.findByIdAndDelete(id);

    if (!deletedPickUpLocation) {
      return res
        .status(404)
        .json({ message: "Empty pallet PickUp location not found" });
    }

    res
      .status(200)
      .json({
        message: "Empty pallet PickUp location deleted successfully",
        data: deletedPickUpLocation,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting empty pallet PickUp location", error });
  }
};
// Update an empty pallet PickUp location by ID
export const editEmptyPalletPickUp = async (req, res) => {
  const { id, userId, role } = req.query;
  const updateData = req.body;

  try {
    // Update based on your custom id field
    const updatedPickUpLocation =
      await EmptyPalletPickUpLocation.findOneAndUpdate(
        { _id: id },
        { $set: updateData, userId, role },
        { new: true }
      );

    if (!updatedPickUpLocation) {
      return res
        .status(404)
        .json({ message: "Empty pallet PickUp location not found" });
    }

    res.status(200).json({
      message: "Empty pallet PickUp location updated successfully",
      data: updatedPickUpLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating empty pallet PickUp location",
      error,
    });
  }
};
