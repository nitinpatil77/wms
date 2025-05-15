import mongoose from "mongoose";

const emptyPalletDropSchema = new mongoose.Schema(
  {
    agv_storage_name: { type: String, required: true },
    user_storage_name: { type: String, required: true,unique: true },
    landmark: { type: String, required: true },
    position: { type: String, required: true ,unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const EmptyPalletDropLocation = mongoose.model(
  "EmptyPalletDropUp",
  emptyPalletDropSchema
);
export default EmptyPalletDropLocation;
