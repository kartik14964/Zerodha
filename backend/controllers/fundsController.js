const { UserModel } = require("../model/UserModel");

const addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.balance += Number(amount);
    await user.save();
    
    res.json({ message: "Funds added successfully", balance: user.balance });
  } catch (err) {
    console.error("Error adding funds:", err);
    res.status(500).json({ message: "Server error while adding funds." });
  }
};

const withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.balance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient funds to withdraw" });
    }
    
    user.balance -= Number(amount);
    await user.save();
    
    res.json({ message: "Funds withdrawn successfully", balance: user.balance });
  } catch (err) {
    console.error("Error withdrawing funds:", err);
    res.status(500).json({ message: "Server error while withdrawing funds." });
  }
};

module.exports = { addFunds, withdrawFunds };
