const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware

const app = express();
const PORT = process.env.PORT || 3000;
// Enable CORS for all routes
app.use(cors());

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect(
  "mongodb+srv://ashuabhishekksj:yN5fNQHnxRT3hl13@cluster0.vxl6o3y.mongodb.net/",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Check MongoDB connection status
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB successfully");
});

// Define a patient schema
const patientSchema = new mongoose.Schema({
  serialNo: String,
  date: Date,
  patientName: String,
  age: String,
  relationship: String,
  name: String,
  address: String,
  contactNo: String,
  referred: String,
  consultancy: String,
  gender: String,
  admitDate: String,
  servicesData: [{ service: String, price: Number }],
  totalAmount: Number,
  lessAmount: Number,
  netAmount: Number,
});

// Create a patient model
const Patient = mongoose.model("Patient", patientSchema);

// Middleware to parse JSON in the request body
app.use(bodyParser.json());

// API endpoint to post patient data
app.post("/api/patient", async (req, res) => {
  try {
    const patientData = req.body;
    const patient = new Patient(patientData);
    await patient.save();
    res.status(201).json({ message: "Patient data saved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API endpoint to search for patient data using query parameters
app.get("/api/patient/search", async (req, res) => {
  try {
    const query = req.query; // Get query parameters from the request

    // Build a dynamic query based on the received parameters
    const dynamicQuery = {};
    Object.keys(query).forEach((key) => {
      // Check if the value is a string, and if so, make the search case-insensitive
      if (typeof query[key] === "string") {
        dynamicQuery[key] = { $regex: new RegExp(query[key], "i") };
      } else {
        dynamicQuery[key] = query[key];
      }
    });

    const searchResults = await Patient.find(dynamicQuery);

    res.status(200).json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API endpoint to post multiple patients' data
app.post("/api/patients/bulk", async (req, res) => {
  try {
    const patientsData = req.body;

    // Ensure that the request body contains an array of patient data
    if (!Array.isArray(patientsData)) {
      return res
        .status(400)
        .json({ error: "Invalid request body. Expected an array." });
    }

    // Filter out already synced patients
    const unsyncedPatientsData = patientsData.filter(
      (patient) => !patient.isSynced
    );

    // Use the insertMany function to insert multiple patients at once
    await Patient.insertMany(unsyncedPatientsData);

    // Mark inserted patients as synced
    await Patient.updateMany(
      { _id: { $in: unsyncedPatientsData.map((patient) => patient._id) } },
      { isSynced: true }
    );

    res.status(201).json({ message: "Patients data saved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
