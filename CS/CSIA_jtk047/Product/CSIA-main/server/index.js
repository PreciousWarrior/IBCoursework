import {
  queryStudentByID,
  queryStudentsStartingWithName,
  addLateArrival,
  deleteArrival,
} from "./crud.js";
import express from "express";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import "dotenv/config";
import "./model/Teacher.js";
import { numTimesLate } from "./emails.js";

const app = express();

// Use static middleware before auth or rate limiting
app.use("/static", express.static("static"));

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 50,
});

app.use(cors());

app.use((req, res, next) => {
  if (req.path !== "/queryName") {
    // Excluded due to high volume
    limiter(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (req.path !== "/queryName") {
    // Excluded due to no senstitive data
    const provided = req.headers["passkey"];
    const required = process.env.PASSKEY;
    if (!provided || provided !== required) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } else {
    next();
  }
});

app.use(express.json());

app.get("/ping", (req, res) => {
  return res.status(200).json("Pong!");
});

app.get("/queryName", async (req, res) => {
  if (!req.query.name) {
    return res.status(400).json("Missing name");
  }
  return res
    .status(200)
    .json(await queryStudentsStartingWithName(req.query.name));
});

app.get("/queryID", async (req, res) => {
  if (!req.query.studentID) {
    return res.status(400).json("Missing ID");
  }
  const student = await queryStudentByID(req.query.studentID);
  if (!student) {
    return res.status(400).json("Invalid ID");
  }
  const studentObject = student.toObject();
  studentObject.wasLateThrice = numTimesLate(student) >= 3;
  return res.status(200).json(studentObject);
});

app.post("/arrival", async (req, res) => {
  const { studentID, building, reason } = req.body;
  const successful = await addLateArrival(studentID, building, reason);
  if (successful) return res.status(200).json("Successful");
  return res.status(400).json("Invalid body");
});

app.delete("/arrival", async (req, res) => {
  const { studentID, arrivalID } = req.query;
  const successful = await deleteArrival(studentID, arrivalID);
  if (successful) return res.status(200).json("Successful");
  return res.status(400).json("Invalid body");
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
