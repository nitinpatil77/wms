import mongoose from "mongoose";

const emptyPalletPickUpSchema = new mongoose.Schema(
  {
    agv_storage_name: { type: String, required: true },
    user_storage_name: { type: String, required: true,unique: true },
    landmark: { type: String, required: true },
    position: {type:String,required:true,unique:true},
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const EmptyPalletPickUpLocation = mongoose.model(
  "EmptyPalletPickUp",
  emptyPalletPickUpSchema
);
export default EmptyPalletPickUpLocation;
