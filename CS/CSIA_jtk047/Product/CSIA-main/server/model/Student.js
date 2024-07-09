import mongoose from "mongoose";
const { Schema, model } = mongoose;
import validator from "email-validator";
import lateArrivalSchema from "../schema/lateArrival.js";

const studentSchema = new Schema({
  // Name of the student, should be a string and is required and unique
  name: { type: String, required: true, unique: true },
  // Grade of the student, should be a number between 6 and 12, and is required
  grade: {
    type: Number,
    required: true,
    validate: (grade) => Number.isInteger(grade) && grade >= 6 && grade <= 12,
  },
  // Section of the student, should be one of the specified letters, and is required
  section: {
    type: String,
    required: true,
    validate: (section) => ["A", "B", "C", "D", "E", "F"].includes(section),
  },
  // Email of the student, should be a valid email format, and is required
  email: { type: String, required: true, validate: validator.validate },
  // Guardians of the student, should contain at least one guardian, each with a name and email, and is required
  guardians: {
    type: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true, validate: validator.validate },
      },
    ],
    validate: (guardians) => guardians.length > 0,
    required: true,
  },
  // Teachers of the student, should contain exactly two teacher references, and is required
  teachers: {
    type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
    validate: (teachers) => teachers.length == 2,
    required: true,
  },
  // Unique identifier for the student, should be a string and is required and unique
  id: { type: String, required: true, unique: true },
  // Late arrivals of the student, an array containing late arrival information
  lateArrivals: {
    type: [lateArrivalSchema],
  },
});

// Creating indexes for quick access and ensuring uniqueness
studentSchema.index({ name: 1 }, { unique: true });
studentSchema.index({ id: 1 }, { unique: true });

const Student = model("Student", studentSchema);
export default Student;
