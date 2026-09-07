const mongoose = require("mongoose");
const { UserModel } = require("../model/UserModel");
const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { OrdersModel } = require("../model/OrdersModel");

const placeOrder = async (req, res) => {
  const { name, qty, price, mode, idempotencyKey } = req.body;
  
  if (!idempotencyKey) {
    return res.status(400).json({ message: "Idempotency key is required." });
  }

  const orderQty = Number(qty);
  const orderPrice = Number(price);
  const totalTransactionValue = orderQty * orderPrice;
  const userId = req.user._id;

  // Initial fast check for existing order (Idempotency)
  const existingOrderCheck = await OrdersModel.findOne({ user: userId, idempotencyKey });
  if (existingOrderCheck) {
    if (existingOrderCheck.name !== name || existingOrderCheck.qty !== orderQty || existingOrderCheck.price !== orderPrice || existingOrderCheck.mode !== mode) {
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
        if (user.balance < totalTransactionValue) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        user.balance -= totalTransactionValue;
        await user.save({ session });
        
        const existingHolding = await HoldingsModel.findOne({ name, user: userId }).session(session);

        if (existingHolding) {
          const totalOldValue = existingHolding.qty * existingHolding.avg;
          const totalNewValue = orderQty * orderPrice;
          const newAvg = Number(((totalOldValue + totalNewValue) / (existingHolding.qty + orderQty)).toFixed(2));
          existingHolding.qty += orderQty;
          existingHolding.avg = newAvg;
          existingHolding.price = orderPrice;
          await existingHolding.save({ session });
        } else {
          await new HoldingsModel({
            user: userId,
            name,
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
        user.balance += totalTransactionValue;
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

      // SAVE ORDER
      await new OrdersModel({
        user: userId, 
        name,
        qty: orderQty,
        price: orderPrice,
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
        if (existingOrder.name !== name || existingOrder.qty !== orderQty || existingOrder.price !== orderPrice || existingOrder.mode !== mode) {
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
