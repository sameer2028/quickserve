require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant.model');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const r = await Restaurant.findOne();
    const d = new Date();
    console.log('isOpenAt:', r.isOpenAt(d));
    
    // Manual check based on my new code
    const options = { timeZone: 'Asia/Kolkata' };
    const dayString = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long' }).format(d).toLowerCase();
    
    const hours = r.operatingHours.find((h) => h.day === dayString);
    console.log('hours:', hours);

    const currentHour = new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit', hourCycle: 'h23' }).format(d);
    const currentMinute = new Intl.DateTimeFormat('en-US', { ...options, minute: '2-digit' }).format(d);
    
    const currentTime = `${currentHour}:${currentMinute}`;
    console.log('currentTime:', currentTime);
    console.log('currentTime >= hours.open:', currentTime >= hours.open);
    console.log('currentTime <= hours.close:', currentTime <= hours.close);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
run();
