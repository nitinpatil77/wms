import mongoose from "mongoose";

const skuSchema=new mongoose.Schema(
    {
       
        skuDetails: { type: String, required: true },
        skuDescription: { type: String},
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, required: true }
    },
    { timestamps: true }
)

const skuModel = mongoose.models.sku || mongoose.model("sku", skuSchema);
export default skuModel;