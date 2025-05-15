import mongoose from "mongoose";

const compoundSchema = new mongoose.Schema(
  {

    skuDetails: { type: String, required: true,unique: true },
    description: {
      type: String,
      
    },
    age: { type: Number, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const compoundModel =
  mongoose.models.compound || mongoose.model("compoundCode", compoundSchema);

export default compoundModel;
