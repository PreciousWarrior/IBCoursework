import mongoose from "mongoose"
const {model} = mongoose;
import lateArrivalSchema from "../schema/lateArrival.js"

const LateArrival = model("LateArrival", lateArrivalSchema)
export default LateArrival