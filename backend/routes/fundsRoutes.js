const express = require("express");
const router = express.Router();
const { addFunds, withdrawFunds } = require("../controllers/fundsController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/addFunds", authenticateToken, addFunds);
router.post("/withdrawFunds", authenticateToken, withdrawFunds);

module.exports = router;
