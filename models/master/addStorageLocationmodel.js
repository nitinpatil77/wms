import mongoose from "mongoose";

const storageLocationSchema = new mongoose.Schema(
  {
    agv_storage_name: { type: String, required: true },
    level: { type: String, required: true, enum: ["bottom", "middle", "top"] },
    status: { type: Number, required: true, default: 0 },
    user_storage_name: { type: Number, required: true, unique: true },
    landmark: { type: String, required: true },
    warehouse: { type: String, required: true ,enum: ["Laydown5", "Laydown4"] },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const StorageLocation = mongoose.model(
  "StorageLocation",
  storageLocationSchema
);
export default StorageLocation;
