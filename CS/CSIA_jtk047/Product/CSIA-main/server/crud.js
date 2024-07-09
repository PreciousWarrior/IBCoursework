import mongoose from "mongoose";
import Student from "./model/Student.js";
import LateArrival from "./model/LateArrival.js";
import escapeStringRegexp from "escape-string-regexp";
import "dotenv/config";
import { sendTeachers, sendGuardiansAndStudent } from "./emails.js";

export async function addLateArrival(studentID, building, reason) {
  const filter = { id: studentID }; // Search all students matching with ID
  const student = await Student.findOne(filter);
  if (!student) return false; // Invalid ID
  try {
    student.lateArrivals.push(new LateArrival({ building, reason }));
    await student.save(); // Save new arrival in DB
    sendTeachers(await student.populate("teachers")); // Populate teacher info using foreign key, send email to teachers
    sendGuardiansAndStudent(student); // Send email to parents and student
    return true;
  } catch (error) {
    // Invalid data given for arrival
    return false;
  }
}

export async function deleteArrival(studentID, arrivalID) {
  const filter = { id: studentID }; // Search all students matching with ID
  const student = await Student.findOne(filter);
  if (!student) {
    return false; // Invalid ID
  }
  try {
    student.lateArrivals = student.lateArrivals.filter(
      (arrival) => arrival._id != arrivalID
    ); // Remove arrival matching arrivalID
    await student.save();
    return true;
  } catch (error) {
    return false; // Invalid arrival ID
  }
}

export async function queryStudentsStartingWithName(name) {
  const sanitizedName = escapeStringRegexp(name);
  const regexPattern = new RegExp(`^${sanitizedName}`, "i"); // starts with name ignoring case
  const results = await Student.find({ name: { $regex: regexPattern } }).select(
    "name id"
  );
  return results;
}

export async function queryStudentByID(id) {
  const student = await Student.findOne({ id });
  return student;
}
mongoose.connect(`mongodb://127.0.0.1:${process.env.MONGOPORT}/csia`);
console.log("connected to mongodb");
