import mongoose from "mongoose";

const manualRetrievalSchema = new mongoose.Schema({
    operationId: { type: mongoose.Schema.Types.ObjectId, ref: "OperationModel", required: true },
    skuDetails: { type: Object, required: true }, // Assuming skuDetails is an object with SKU info
    noOfBatches: { type: Number, required: true },
    fromLoc: { type: String, required: true },
    toLoc: { type: String, required: true },
    fromLoc2: { type: String, required: true },
    toLoc2: { type: String, required: true },
    retrievedAt: { type: Date, default: Date.now } // Timestamp for retrieval
});

const ManualRetrieval = mongoose.model("ManualRetrieval", manualRetrievalSchema);

export default ManualRetrieval;
