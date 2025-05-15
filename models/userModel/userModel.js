import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    employeeName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "user"], 
      required: true,
    },
    permissions: [{ type: String }],
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
