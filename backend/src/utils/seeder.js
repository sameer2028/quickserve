const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/../../.env' });

// Load models
const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');
const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');
const Wallet = require('../models/Wallet.model');

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
    await Wallet.deleteMany();

    // Create Customer User
    const user = await User.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: '12345678',
      phone: '+919876543210',
      role: 'customer',
      isEmailVerified: true,
    });

    // Create Wallet with ₹5000 test balance
    const wallet = await Wallet.create({
      user: user._id,
      balance: 5000,
      transactions: [
        {
          type: 'credit',
          amount: 5000,
          description: 'Welcome bonus - Test wallet credits',
          balanceAfter: 5000,
          createdAt: new Date(),
        },
      ],
    });

    // Create Restaurant Owner
    const owner = await User.create({
      name: 'Restaurant Owner',
      email: 'owner@example.com',
      password: '12345678',
      phone: '+919876543211',
      role: 'restaurant_owner',
      isEmailVerified: true,
    });

    // Create owner wallet
    await Wallet.create({ user: owner._id, balance: 0 });

    console.log('Users & wallets created (Customer wallet: ₹5000)');

    // Create Restaurant with images & operating hours
    const restaurant = await Restaurant.create({
      owner: owner._id,
      name: 'Spicy Bite',
      slug: 'spicy-bite',
      description: 'Best Indian fast food in town. Authentic flavors with a modern twist.',
      email: 'spicybite@example.com',
      phone: '+919876543212',
      cuisine: ['Indian', 'Fast Food', 'Street Food'],
      avgCostForTwo: 500,
      foodType: 'both',
      logo: {
        url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
        public_id: 'seed_logo',
      },
      coverImage: {
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
        public_id: 'seed_cover',
      },
      images: [
        { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&fit=crop', public_id: 'seed_img_1' },
        { url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&fit=crop', public_id: 'seed_img_2' },
      ],
      address: {
        street: '123 Main St',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
      },
      operatingHours: [
        { day: 'monday', open: '08:00', close: '23:00', isClosed: false },
        { day: 'tuesday', open: '08:00', close: '23:00', isClosed: false },
        { day: 'wednesday', open: '08:00', close: '23:00', isClosed: false },
        { day: 'thursday', open: '08:00', close: '23:00', isClosed: false },
        { day: 'friday', open: '08:00', close: '23:30', isClosed: false },
        { day: 'saturday', open: '08:00', close: '23:30', isClosed: false },
        { day: 'sunday', open: '09:00', close: '23:00', isClosed: false },
      ],
      features: {
        acceptsPickup: true,
        acceptsDelivery: true,
        acceptsDineIn: true,
        hasAC: true,
        hasWifi: true,
      },
      taxRate: 5,
      deliveryFee: 40,
      minOrderAmount: 100,
      packagingCharge: 10,
      convenienceFee: 5,
      status: 'active',
    });

    console.log('Restaurant created with images & operating hours');

    // Create Menu Categories
    const mainCourse = await MenuCategory.create({
      restaurant: restaurant._id,
      name: 'Main Course',
      description: 'Delicious main courses from our kitchen',
      isActive: true,
      sortOrder: 1,
    });

    const starters = await MenuCategory.create({
      restaurant: restaurant._id,
      name: 'Starters',
      description: 'Hot and crispy appetizers',
      isActive: true,
      sortOrder: 0,
    });

    const beverages = await MenuCategory.create({
      restaurant: restaurant._id,
      name: 'Beverages',
      description: 'Refreshing drinks and juices',
      isActive: true,
      sortOrder: 2,
    });

    // Create Menu Items with images
    await MenuItem.create([
      {
        restaurant: restaurant._id,
        category: starters._id,
        name: 'Paneer Tikka',
        description: 'Marinated cottage cheese grilled to perfection in tandoor',
        price: 220,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&fit=crop', public_id: 'paneer_tikka' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 15,
        sortOrder: 0,
      },
      {
        restaurant: restaurant._id,
        category: starters._id,
        name: 'Chicken Wings',
        description: 'Crispy fried chicken wings with spicy sauce',
        price: 280,
        foodType: 'non_veg',
        images: [{ url: 'https://images.unsplash.com/photo-1608039829572-9c009ee5bde4?w=400&fit=crop', public_id: 'chicken_wings' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 18,
        sortOrder: 1,
      },
      {
        restaurant: restaurant._id,
        category: mainCourse._id,
        name: 'Paneer Tikka Masala',
        description: 'Cottage cheese cooked in rich tomato gravy with aromatic spices',
        price: 250,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&fit=crop', public_id: 'paneer_masala' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 20,
        sortOrder: 0,
      },
      {
        restaurant: restaurant._id,
        category: mainCourse._id,
        name: 'Butter Chicken',
        description: 'Tender chicken in creamy tomato-butter sauce',
        price: 350,
        foodType: 'non_veg',
        images: [{ url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&fit=crop', public_id: 'butter_chicken' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 25,
        sortOrder: 1,
      },
      {
        restaurant: restaurant._id,
        category: mainCourse._id,
        name: 'Dal Makhani',
        description: 'Slow-cooked black lentils in butter and cream',
        price: 200,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&fit=crop', public_id: 'dal_makhani' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 15,
        sortOrder: 2,
      },
      {
        restaurant: restaurant._id,
        category: mainCourse._id,
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice layered with spiced chicken',
        price: 320,
        foodType: 'non_veg',
        images: [{ url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&fit=crop', public_id: 'biryani' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 30,
        sortOrder: 3,
      },
      {
        restaurant: restaurant._id,
        category: beverages._id,
        name: 'Mango Lassi',
        description: 'Sweet yogurt drink blended with fresh mangoes',
        price: 90,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&fit=crop', public_id: 'mango_lassi' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 5,
        sortOrder: 0,
      },
      {
        restaurant: restaurant._id,
        category: beverages._id,
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with milk',
        price: 50,
        foodType: 'veg',
        images: [{ url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&fit=crop', public_id: 'masala_chai' }],
        isActive: true,
        isAvailable: true,
        preparationTime: 5,
        sortOrder: 1,
      },
    ]);

    console.log('Menu categories & items created with images');
    console.log('\n✅ Data Imported Successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('  Customer: customer@example.com / 12345678 (Wallet: ₹5000)');
    console.log('  Owner:    owner@example.com / 12345678');
    console.log('');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
