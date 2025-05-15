import mongoose from "mongoose";

const agvSchema = new mongoose.Schema(
    {
        agvId: { type: String, required: true ,unique: true}, 
        agvName: { type: String, required: true,unique: true },
        status: {
            type: String,
            enum: ['active', 'inActive'],
            required: true,
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
        role: { type: String, required: true }  
    },
    { timestamps: true } 
);

const agvModel = mongoose.models.agv || mongoose.model("agv", agvSchema);

export default agvModel;
