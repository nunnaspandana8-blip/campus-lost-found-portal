
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const claimRoutes = require("./routes/claimRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);


app.get("/", (req, res) => {
  res.send("Campus Lost and Found API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!"
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
