require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('./src/models/Wallet.model');
const User = require('./src/models/User.model');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const userId = '6a3cc0df28c765894e0350c0';
    const amount = 6500;

    let wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      console.log('Wallet not found, creating a new one...');
      wallet = new Wallet({ user: userId, balance: 0 });
    }

    wallet.credit(amount, 'Manual fund addition', null);
    await wallet.save();
    
    // Ensure the User document has the wallet reference
    await User.findByIdAndUpdate(userId, { wallet: wallet._id });

    console.log(`Successfully added ${amount}. New balance: ${wallet.balance}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

run();
