import mongoose from "mongoose";

const operationHistorySchema = new mongoose.Schema(
  {
    operationId: String,
    fromLoc: String,
    toLoc: String,
    fromLoc2: String,
    toLoc2: String,
    noOfBatches: Number,
    skuDetails: Object,
    operationType: String,
    status: String,
    startedAt: Date,
    completedAt: Date,
    duration: Number,
    timestamps: Date,
    compoundAge: String,
    batch: String,
    warehouse: {
      type: String,
      required: function () {
        return (
          this.operationType !== "EmptyStorage" &&
          this.operationType !== "RETRIEVAL"
        );
      },
      default: null,
    },
    userId: String,
    role: String,
  },
  { timestamps: true }
);

export default mongoose.model("OperationHistory", operationHistorySchema);
