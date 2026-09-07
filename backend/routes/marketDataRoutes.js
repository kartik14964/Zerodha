const express = require("express");
const router = express.Router();
const { getQuotes, searchQuotes } = require("../controllers/marketDataController");

router.get("/quotes", getQuotes);
router.get("/search", searchQuotes);

module.exports = router;
