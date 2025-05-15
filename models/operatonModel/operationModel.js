import mongoose from "mongoose";

const operationSchema = new mongoose.Schema(
  {
    fromLoc: { type: String, required: true },
    toLoc: { type: String, required: true },
    batch: {
      type: String,
      required: function () {
        return (
          this.operationType !== "EmptyStorage" &&
          this.operationType !== "RETRIEVAL"
        );
      },
      unqiue: true,
    },
    noOfBatches: {
      type: Number,
      required: function () {
        return this.operationType !== "EmptyStorage";
      },
      default: null,
    },
    skuDetails: {
      type: String,
      required: function () {
        return this.operationType !== "EmptyStorage";
      },
      default: null,
    },
    operationType: { type: String, required: true },
    status: {
      type: String,
      default: "INQUEUE",
      enum: ["INQUEUE", "RUNNING", "FINISHED", "STOPPED"],
    },
    timestamps: {
      type: Date,
      default: Date.now,
      required: function () {
        return (
          this.operationType !== "EmptyStorage" &&
          this.operationType !== "RETRIEVAL"
        );
      },
      default: null,
    },
    compoundAge: {
      type: String,
      required: function () {
        return (
          this.operationType !== "EmptyStorage" &&
          this.operationType !== "RETRIEVAL"
        );
      },
      default: null,
    },
    warehouse: {
      type: String,
      required: function () {
        return (
          this.operationType !== "EmptyStorage" &&
          this.operationType !== "RETRIEVAL"
        );
      },
      default: "Laydown5",
      enum: ["Laydown5", "Laydown4"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const OperationModel = mongoose.model("Operation", operationSchema);
export default OperationModel;
