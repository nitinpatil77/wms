import mongoose from "mongoose";

const retrievalDropSchema = new mongoose.Schema(
  {
    agv_storage_name: { type: String, required: true },
    user_storage_name: { type: String, required: true, unique: true },
    position: { type: String, required: true ,unique: true },
    landmark: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const RetrievalDropLocation = mongoose.model(
  "RetrievalDrop",
  retrievalDropSchema
);
export default RetrievalDropLocation;
