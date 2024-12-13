const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

// Define Schema and Model
const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Customer = mongoose.model("Customer", customerSchema);

async function addSubscriberToMailerLite(customer) {
  try {
    const response = await axios.post(
      "https://connect.mailerlite.com/api/subscribers", // MailerLite API endpoint
      {
        email: customer.email,
        fields: {
          name: customer.firstName,
          last_name: customer.surname,
          phone: customer.phone,
        },
        groups: ["138180842551772747"], // Replace with your Group ID
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`, // Your API key
        },
      }
    );

    // Log the full response data
    console.log("Subscriber added to MailerLite:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error adding subscriber to MailerLite:", error.response?.data || error.message);
  }
}


// API Endpoints
app.post("/customers", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();

    // Add to MailerLite
    await addSubscriberToMailerLite(req.body);

    res.status(201).send("Customer details saved successfully!");
  } catch (err) {
    console.error("Error saving customer or adding to MailerLite:", err);
    res.status(500).send("Error saving customer details.");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

