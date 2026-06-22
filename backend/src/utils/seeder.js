const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: __dirname + '/../../.env' });

// Load models
const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');
const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');

// Connect to DB
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully for seeding');

    // Clear existing data
    await User.deleteMany();
    await Restaurant.deleteMany();
    await MenuCategory.deleteMany();
    await MenuItem.deleteMany();

    // Create User
    const user = await User.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: '12345678',
      phone: '+919876543210',
      role: 'customer',
      isEmailVerified: true
    });

    const owner = await User.create({
      name: 'Restaurant Owner',
      email: 'owner@example.com',
      password: '12345678',
      phone: '+919876543211',
      role: 'restaurant_owner',
      isEmailVerified: true
    });

    console.log('Users created');

    // Create Restaurant
    const restaurant = await Restaurant.create({
      owner: owner._id,
      name: 'Spicy Bite',
      slug: 'spicy-bite',
      description: 'Best Indian fast food in town',
      email: 'spicybite@example.com',
      phone: '+919876543212',
      cuisine: ['Indian', 'Fast Food'],
      avgCostForTwo: 500,
      foodType: 'both',
      address: {
        street: '123 Main St',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139]
      },
      features: {
        acceptsPickup: true,
        acceptsDelivery: true,
        acceptsDineIn: true
      },
      status: 'active'
    });

    console.log('Restaurant created');

    // Create Menu Category
    const category = await MenuCategory.create({
      restaurant: restaurant._id,
      name: 'Main Course',
      description: 'Delicious main courses',
      isActive: true
    });

    // Create Menu Items
    await MenuItem.create([
      {
        restaurant: restaurant._id,
        category: category._id,
        name: 'Paneer Tikka Masala',
        description: 'Cottage cheese cooked in rich tomato gravy',
        price: 250,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=200' }],
        isActive: true,
        preparationTime: 20
      },
      {
        restaurant: restaurant._id,
        category: category._id,
        name: 'Butter Chicken',
        description: 'Tender chicken in creamy tomato sauce',
        price: 350,
        foodType: 'non_veg',
        images: [{ url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=200' }],
        isActive: true,
        preparationTime: 25
      }
    ]);

    console.log('Menu Data created');
    
    console.log('Data Imported!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
