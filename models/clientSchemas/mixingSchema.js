import mongoose from "mongoose";

const mixingSchema = new mongoose.Schema({}, {  strict: false,
    collection: "mixing" }); // Flexible schema
export default mixingSchema; 