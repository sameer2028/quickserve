const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant.model');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const r = await Restaurant.findOne();
    
    const d = new Date("2026-06-27T13:39:00.000Z");
    console.log("Checking date:", d);
    
    console.log("isOpenAt:", r.isOpenAt(d));

    // Internal logic of isOpenAt
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
      hourCycle: 'h23'
    });
    
    const parts = formatter.formatToParts(d);
    console.log(parts);
    
    const dayPart = parts.find(p => p.type === 'weekday');
    const hourPart = parts.find(p => p.type === 'hour');
    const minutePart = parts.find(p => p.type === 'minute');
    
    const dayString = dayPart.value.toLowerCase();
    const hours = r.operatingHours.find((h) => h.day === dayString);
    console.log("hours:", hours);

    const currentHour = String(hourPart.value).replace(/\D/g, '').padStart(2, '0');
    const currentMinute = String(minutePart.value).replace(/\D/g, '').padStart(2, '0');
    
    const currentTime = `${currentHour}:${currentMinute}`;
    console.log('currentTime:', currentTime);
    
    console.log('currentTime >= hours.open', currentTime >= hours.open);
    console.log('currentTime <= hours.close', currentTime <= hours.close);

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
run();
