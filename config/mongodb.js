import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/wms`);
    console.log(`Main DB Connected`);
  } catch (error) {
    console.error("Main DB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;