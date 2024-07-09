import mongoose from "mongoose";
const { Schema } = mongoose;

const lateArrivalSchema = new Schema({
  arrivalTime: { type: Date, default: Date.now, index: true, required: true },
  building: { type: String, enum: ["Rosewood", "Chestnut"], required: true },
  reason: { type: String, required: true },
});

export default lateArrivalSchema;
