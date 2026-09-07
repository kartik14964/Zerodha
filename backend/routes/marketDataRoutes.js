const express = require("express");
const router = express.Router();
const { getQuotes, searchQuotes, getMarketStatus } = require("../controllers/marketDataController");

router.get("/quotes", getQuotes);
router.get("/search", searchQuotes);
router.get("/market-status", getMarketStatus);

module.exports = router;
