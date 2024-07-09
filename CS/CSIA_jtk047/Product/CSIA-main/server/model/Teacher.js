import mongoose from "mongoose"
const {Schema, model} = mongoose;
import validator from "email-validator"

const teacherSchema = new Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true, validate: validator.validate},
})

const Teacher = model("Teacher", teacherSchema)
export default Teacher;