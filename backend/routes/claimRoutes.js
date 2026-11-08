
const express = require("express");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();
console.log("NEW CLAIM ROUTES LOADED");

// Submit a claim
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { item, claimantName, claimantEmail, message } = req.body;

    if (!item || !claimantName || !claimantEmail || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields."
      });
    }

    const foundItem = await Item.findById(item);

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found."
      });
    }

    if (foundItem.type !== "Found") {
      return res.status(400).json({
        success: false,
        message: "Claims can only be submitted for found items."
      });
    }

    const claim = await Claim.create({
      item,
      claimantName,
      claimantEmail,
      message
    });

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully.",
      claim
    });

  } catch (error) {
    console.error("Submit claim error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit claim."
    });
  }
});

// Get user's claims
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const claims = await Claim.find({
      claimantEmail: req.user.email
    })
      .populate("item", "title type location status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      claims
    });

  } catch (error) {
    console.error("My claims error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch claims."
    });
  }
});

// Get all claims (Admin only)
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("item", "title type location status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      claims
    });

  } catch (error) {
    console.error("All claims error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch all claims."
    });
  }
});

// Update claim status (Admin only)
router.patch("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Approved", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim status."
      });
    }

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found."
      });
    }

    claim.status = status;
    await claim.save();

    let updatedItem = null;

    // Update linked item when claim is approved
    if (status === "Approved") {
      updatedItem = await Item.findByIdAndUpdate(
        claim.item,
        {
          $set: {
            status: "Claimed"
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: "Claim updated, but linked item was not found."
        });
      }
    }

    const updatedClaim = await Claim.findById(claim._id)
      .populate("item", "title type location status");

    res.json({
      success: true,
      message: "Claim status updated successfully.",
      claim: updatedClaim,
      updatedItem
    });

  } catch (error) {
    console.error("Claim update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update claim status.",
      error: error.message
    });
  }
});

module.exports = router;
