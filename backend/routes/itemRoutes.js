
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Item = require("../models/item");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const item = await Item.create(req.body);

    res.status(201).json({
      success: true,
      message: "Item added successfully",
      item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, category, type, status } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
