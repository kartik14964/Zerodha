const mongoose = require("mongoose");
const { UserModel } = require("../model/UserModel");
const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { OrdersModel } = require("../model/OrdersModel");
const { cache, getInitialQuotes } = require("../services/marketDataService");
const { getRateToINR } = require("../services/fxService");

const placeOrder = async (req, res) => {
  const { name, symbol, exchange, market, currency, qty, mode, idempotencyKey } = req.body;

  if (!idempotencyKey) {
    return res.status(400).json({ message: "Idempotency key is required." });
  }

  const lookupKey = symbol || name;
  let cachedStock = cache.get(lookupKey);

  // Cache miss: do a live one-time fetch rather than rejecting the order outright
  if (!cachedStock) {
    try {
      const freshData = await getInitialQuotes([lookupKey]);
      cachedStock = freshData[0] || null;
    } catch (fetchErr) {
      console.warn("Live price fetch failed for", lookupKey, fetchErr.message);
    }
  }

  if (!cachedStock) {
    return res.status(400).json({ message: "Market data unavailable. Cannot price order safely. Please wait a moment and try again." });
  }

  const orderQty = Number(qty);
  // Security Fix: Never trust client price. Use authoritative server-side cached NATIVE price.
  const orderPrice = Number(cachedStock.price);
  const nativeTransactionValue = orderQty * orderPrice;
  const currencyCode = currency || cachedStock.currency || "INR";
  const userId = req.user._id;

  // Resolve dynamic FX rate
  let fxRateToINR = 1;
  try {
    fxRateToINR = await getRateToINR(currencyCode);
  } catch (fxErr) {
    return res.status(503).json({ message: "FX Conversion Service unavailable. Cannot price order safely." });
  }

  const totalTransactionValueINR = nativeTransactionValue * fxRateToINR;

  // Initial fast check for existing order (Idempotency)
  const existingOrderCheck = await OrdersModel.findOne({ user: userId, idempotencyKey });
  if (existingOrderCheck) {
    if (existingOrderCheck.name !== name || existingOrderCheck.qty !== orderQty || existingOrderCheck.mode !== mode) {
      return res.status(409).json({ message: "Conflict: Same idempotency key used with different parameters." });
    }
    return res.status(200).json({ message: "Order processed successfully (Idempotent response)" });
  }

  const session = await mongoose.startSession();

  try {
    // Execute the order entirely within an ACID transaction
    await session.withTransaction(async () => {
      const user = await UserModel.findById(userId).session(session);
      if (!user) {
        console.log("USER IS NULL. userId:", userId);
        throw new Error("USER_NOT_FOUND");
      }

      // BUY LOGIC
      if (mode === "BUY") {
        if (user.balance < totalTransactionValueINR) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        user.balance -= totalTransactionValueINR;
        await user.save({ session });

        const existingHolding = await HoldingsModel.findOne({ name, user: userId }).session(session);

        if (existingHolding) {
          // Average price remains in NATIVE currency!
          const totalOldValueNative = existingHolding.qty * existingHolding.avg;
          const newAvg = Number(((totalOldValueNative + nativeTransactionValue) / (existingHolding.qty + orderQty)).toFixed(4));
          existingHolding.qty += orderQty;
          existingHolding.avg = newAvg;
          existingHolding.price = orderPrice;
          await existingHolding.save({ session });
        } else {
          await new HoldingsModel({
            user: userId,
            name,
            symbol: symbol || name,
            exchange: exchange || "",
            market: market || "",
            currency: currency || "INR",
            qty: orderQty,
            avg: orderPrice,
            price: orderPrice,
            net: "0%",
            day: "0%",
          }).save({ session });
        }

        const existingPos = await PositionsModel.findOne({ name, user: userId }).session(session);
        if (existingPos) {
          existingPos.qty += orderQty;
          await existingPos.save({ session });
        } else {
          await new PositionsModel({
            user: userId,
            name,
            symbol: symbol || name,
            exchange: exchange || "",
            market: market || "",
            currency: currency || "INR",
            qty: orderQty,
            avg: orderPrice,
            price: orderPrice,
            product: "CNC",
            isLoss: false,
          }).save({ session });
        }
      }
      // SELL LOGIC
      else if (mode === "SELL") {
        const existingHolding = await HoldingsModel.findOne({ name, user: userId }).session(session);

        if (!existingHolding) {
          throw new Error("NOT_OWNED");
        }

        if (existingHolding.qty < orderQty) {
          throw new Error("INSUFFICIENT_QTY");
        }
        
        // Sell credits INR equivalent
        user.balance += totalTransactionValueINR;
        await user.save({ session });

        if (existingHolding.qty === orderQty) {
          await HoldingsModel.deleteOne({ name, user: userId }).session(session);
        } else {
          existingHolding.qty -= orderQty;
          existingHolding.price = orderPrice;
          await existingHolding.save({ session });
        }

        const existingPos = await PositionsModel.findOne({ name, user: userId }).session(session);
        if (existingPos) {
          if (existingPos.qty <= orderQty) {
            await PositionsModel.deleteOne({ name, user: userId }).session(session);
          } else {
            existingPos.qty -= orderQty;
            await existingPos.save({ session });
          }
        }
      }

      // SAVE ORDER WITH EXACT FX AT TRANSACTION TIME
      await new OrdersModel({
        user: userId,
        name,
        symbol: symbol || name,
        exchange: exchange || "",
        market: market || "",
        currency: currencyCode,
        qty: orderQty,
        price: orderPrice, // Legacy alias
        orderPrice: orderPrice,
        totalTransactionValueNative: nativeTransactionValue,
        fxRateToINR: fxRateToINR,
        totalTransactionValueINR: totalTransactionValueINR,
        mode,
        idempotencyKey
      }).save({ session });
    });

    res.status(201).json({ message: "Order processed successfully!" });
  } catch (err) {
    // E11000 duplicate key error means it was created concurrently while this transaction was running
    if (err.code === 11000) {
      const existingOrder = await OrdersModel.findOne({ user: userId, idempotencyKey });
      if (existingOrder) {
        if (existingOrder.name !== name || existingOrder.qty !== orderQty || existingOrder.mode !== mode) {
          return res.status(409).json({ message: "Conflict: Same idempotency key used with different parameters." });
        }
        return res.status(200).json({ message: "Order processed successfully (Idempotent response)" });
      }
    }

    // Handle business logic throw strings
    if (err.message === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ message: `Insufficient funds.` });
    }
    if (err.message === "NOT_OWNED") {
      return res.status(400).json({ message: "Sell failed: You do not own this stock." });
    }
    if (err.message === "INSUFFICIENT_QTY") {
      return res.status(400).json({ message: `Sell failed: Insufficient quantity.` });
    }

    console.error("Transaction Aborted/Failed:", err);
    res.status(500).json({ message: "Server Error processing order." });
  } finally {
    await session.endSession();
  }
};

const getAllOrders = async (req, res) => {
  try {
    const userOrders = await OrdersModel.find({ user: req.user._id });
    res.json(userOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error while fetching orders." });
  }
};

module.exports = { placeOrder, getAllOrders };
