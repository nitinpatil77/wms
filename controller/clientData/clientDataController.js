import mongoose from "mongoose";
import ClientBeforeQaCheckModel from "../../models/clientDataModel/clientBeforeQaCheckModel.js";
// ----------------------Add Client Data Before QA Check at realtime ------------------------
export const addClientDataBeforeQaCheck = async (req, res) => {
  
  const { batch, material, work_center, process, compound_age, actual_shift,created_at } = req.body;

  try {
    const newClientBeforeQaCheck = new ClientBeforeQaCheckModel({
      batch,
      material,
      work_center,
      process,
      compound_age,
      actual_shift,
      created_at
    });

    await newClientBeforeQaCheck.save();
    res
      .status(201)
      .json({ message: "New client before QA check added successfully", data: newClientBeforeQaCheck });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding new client before QA check", error });
  }
}
// ----------------------Get Client Data Before QA Check at realtime ------------------------
export const getClientDataBeforeQaCheckByBatch = async (req, res) => {
  const { batch } = req.query;
  try {
    const clientBeforeQaCheck = await ClientBeforeQaCheckModel.find({ batch: batch }).sort({ created_at: -1 });
    if (!clientBeforeQaCheck) {
      return res.status(404).json({ message: "No client before QA check data found" });
    } 
    res.status(200).json(clientBeforeQaCheck);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving client before QA check data", error });
  }
}

