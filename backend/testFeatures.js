require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant.model');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const r = await Restaurant.findOne();
    console.log(r.features);
  } catch(e) {
  } finally {
    mongoose.disconnect();
  }
}
run();
