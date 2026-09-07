require("dotenv").config();
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { UserModel } = require("../model/UserModel");
const { OrdersModel } = require("../model/OrdersModel");
const { HoldingsModel } = require("../model/HoldingsModel");
const { placeOrder } = require("../controllers/orderController");

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
  req.user = { _id: req.headers["x-user-id"] };
  next();
});
app.post("/newOrder", placeOrder);

jest.setTimeout(30000);

describe("Transactional Order Engine Concurrency Tests", () => {
  let userId;
  const initialBalance = 100000;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/zerodha_test");
    await OrdersModel.createIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await OrdersModel.deleteMany({});
    await HoldingsModel.deleteMany({});

    const user = await new UserModel({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
      balance: initialBalance
    }).save();
    userId = user._id;
  });

  it("Test A (Idempotency): 100 identical requests + same key -> 1 order", async () => {
    const idempotencyKey = crypto.randomUUID();
    const reqBody = {
      name: "TCS",
      qty: 1,
      price: 3000,
      mode: "BUY",
      idempotencyKey
    };

    // Fire 100 requests completely in parallel
    const requests = Array.from({ length: 100 }).map(() =>
      request(app)
        .post("/newOrder")
        .set("x-user-id", userId.toString())
        .send(reqBody)
    );

    const responses = await Promise.all(requests);

    // Verify all responses were 200 or 201 (success or idempotent success)
    responses.forEach(res => {
      expect([200, 201]).toContain(res.status);
    });

    // Exactly 1 order should exist
    const ordersCount = await OrdersModel.countDocuments({ user: userId });
    expect(ordersCount).toBe(1);

    // Balance should be deducted exactly once
    const user = await UserModel.findById(userId);
    expect(user.balance).toBe(initialBalance - 3000);
  });

  it("Test B (Concurrency): 60 concurrent legitimate orders -> balance remains correct", async () => {
    const qty = 1;
    const price = 2000; // 50 * 2000 = 100,000 max. 60 requests should result in 10 failures.
    
    // Fire 60 distinct requests
    const requests = Array.from({ length: 60 }).map(() =>
      request(app)
        .post("/newOrder")
        .set("x-user-id", userId.toString())
        .send({
          name: "INFY",
          qty,
          price,
          mode: "BUY",
          idempotencyKey: crypto.randomUUID()
        })
    );

    const responses = await Promise.all(requests);

    // Initial balance is 100,000. Each order costs 2,000.
    // 50 orders should succeed, 10 should fail with 400
    const successCount = responses.filter(r => r.status === 201).length;
    const failCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(50);
    expect(failCount).toBe(10);

    const user = await UserModel.findById(userId);
    expect(user.balance).toBe(0); // 100,000 - (50 * 2000) = 0

    const ordersCount = await OrdersModel.countDocuments({ user: userId });
    expect(ordersCount).toBe(50);

    const holding = await HoldingsModel.findOne({ user: userId, name: "INFY" });
    expect(holding.qty).toBe(50);
  });
});
