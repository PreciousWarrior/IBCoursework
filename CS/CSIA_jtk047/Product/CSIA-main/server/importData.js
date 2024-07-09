import Student from "./model/Student.js";
import Teacher from "./model/Teacher.js";
import fs from "fs/promises";
import mongoose from "mongoose";
import "dotenv/config";

mongoose.connect(`mongodb://127.0.0.1:${process.env.MONGOPORT}/csia`);
console.log("connected!");

const data = await fs.readFile("./data.json");
const sections = JSON.parse(data); // Parse data into JS object
for (let i = 0; i < sections.length; i++) {
  // Loop over sections
  const section = sections[i];
  const teacher1 = await Teacher.create({
    name: section.teacher1,
    email: section.teacher1email,
  }); // Add form teacher from section to DB
  const teacher2 = await Teacher.create({
    name: section.teacher2,
    email: section.teacher2email,
  }); // Add co-form teacher from section to DB
  const students = section.students;
  for (let j = 0; j < students.length; j++) {
    // Loop over students in section
    const student = students[j];
    const { name, guardians, id, email } = student;
    await Student.create({
      // Add student object to DB
      name,
      guardians,
      id,
      email,
      teachers: [teacher1._id, teacher2._id], // Reference both teachers
      section: section.section,
      grade: section.grade,
    });
  }
}
console.log("Done.");
