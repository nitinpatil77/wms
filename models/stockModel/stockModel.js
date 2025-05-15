import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operation",
      required: true,
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "Invalid operationId",
      },
    },
    noOfBatches: { type: Number, required: true }, 
    skuDetails: { type: String, required: true },
    fromLoc: { type: String, required: true },
    toLoc: { type: Number, required: true },
    fromLoc2: { type: String, required: false }, 
    toLoc2: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    batch:{ type: String, required: true },
    qaStatus:{type:String,required: true ,enum: ["ok", "Hold","reject","overAgeAlert","overage"],default:'Hold'},
    warehouse: { type: String, required: true ,default: "Laydown5",enum: ["Laydown5", "Laydown4"] },
    compoundAge: {
         type: String,
         required: function () {
           return this.operationType !== "EmptyStorage";
         },
         default: null,
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

// Create FIFO Index on createdAt
stockSchema.index({ createdAt: 1 });

const Stock = mongoose.model("Stock", stockSchema);
export default Stock;
