import mongoose from "mongoose";

const clientBeforeQaCheckSchema = new mongoose.Schema(
  {
    batch: { type: String, required: true,unique: true  },
    material: { type: String, required: true },
    work_center: { type: String, required: true },
    // process: { type: String, required: true },
    compound_age: { type: Number, required: true },
    quality_status:{type: String, required: true},
    actual_shift: { type: Number, required: true },
    created_at: { type: Date, default: Date.now,required: true },
  },
  { timestamps: true }
);

const ClientBeforeQaCheckModel = mongoose.model(
 "clientBeforeQaCheck", clientBeforeQaCheckSchema
);
export default ClientBeforeQaCheckModel;