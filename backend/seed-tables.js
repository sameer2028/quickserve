require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant.model');
const Table = require('./src/models/Table.model');

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find();
    console.log(`Found ${restaurants.length} restaurants.`);

    for (const restaurant of restaurants) {
      console.log(`Adding 5 tables to ${restaurant.name}...`);
      
      const tablesToAdd = [
        { tableNumber: 'T1', capacity: 2, restaurant: restaurant._id },
        { tableNumber: 'T2', capacity: 2, restaurant: restaurant._id },
        { tableNumber: 'T3', capacity: 4, restaurant: restaurant._id },
        { tableNumber: 'T4', capacity: 4, restaurant: restaurant._id },
        { tableNumber: 'T5', capacity: 6, restaurant: restaurant._id },
      ];

      for (const table of tablesToAdd) {
        // Check if table already exists
        const exists = await Table.findOne({ tableNumber: table.tableNumber, restaurant: restaurant._id });
        if (!exists) {
          await Table.create(table);
          console.log(`- Created Table ${table.tableNumber} (Cap: ${table.capacity})`);
        } else {
          console.log(`- Table ${table.tableNumber} already exists.`);
        }
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tables:', error);
    process.exit(1);
  }
};

seedTables();
