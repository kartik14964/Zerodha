const express = require("express");
const router = express.Router();
const { placeOrder, getAllOrders } = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/newOrder", authenticateToken, placeOrder);
router.get("/allOrders", authenticateToken, getAllOrders);

module.exports = router;
