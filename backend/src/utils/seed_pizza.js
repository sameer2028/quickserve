const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../../.env' });

const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');
const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');
const Wallet = require('../models/Wallet.model');

const seedPizza = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully for pizza seeding');

    // Create Restaurant Owner
    const owner = await User.create({
      name: 'Mario Rossi',
      email: 'mario@slicehaven.com',
      password: 'password123',
      phone: '+919876500000',
      role: 'restaurant_owner',
      isEmailVerified: true,
    });

    // Create owner wallet
    await Wallet.create({ user: owner._id, balance: 0 });

    console.log('Owner account created: mario@slicehaven.com / password123');

    // Create Restaurant
    const restaurant = await Restaurant.create({
      owner: owner._id,
      name: 'Slice Haven Pizzeria',
      slug: 'slice-haven',
      description: 'Authentic wood-fired pizzas with fresh, locally sourced ingredients.',
      email: 'hello@slicehaven.com',
      phone: '+919876500001',
      cuisine: ['Italian', 'Pizza', 'Fast Food'],
      avgCostForTwo: 800,
      foodType: 'both',
      logo: {
        url: 'https://images.unsplash.com/photo-1590947132387-155cc3dd268a?w=200&h=200&fit=crop',
        public_id: 'pizza_logo',
      },
      coverImage: {
        url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=400&fit=crop',
        public_id: 'pizza_cover',
      },
      address: {
        street: '45 Baker Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110002',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.210, 28.6140],
      },
      operatingHours: [
        { day: 'monday', open: '11:00', close: '23:00', isClosed: false },
        { day: 'tuesday', open: '11:00', close: '23:00', isClosed: false },
        { day: 'wednesday', open: '11:00', close: '23:00', isClosed: false },
        { day: 'thursday', open: '11:00', close: '23:00', isClosed: false },
        { day: 'friday', open: '11:00', close: '00:00', isClosed: false },
        { day: 'saturday', open: '11:00', close: '00:00', isClosed: false },
        { day: 'sunday', open: '11:00', close: '23:00', isClosed: false },
      ],
      features: {
        acceptsPickup: true,
        acceptsDelivery: true,
        acceptsDineIn: true,
      },
      taxRate: 5,
      deliveryFee: 50,
      minOrderAmount: 200,
      packagingCharge: 20,
      status: 'active',
    });

    console.log('Restaurant created: Slice Haven Pizzeria');

    // Create Categories
    const pizzas = await MenuCategory.create({ restaurant: restaurant._id, name: 'Wood-fired Pizzas', sortOrder: 1, isActive: true });
    const sides = await MenuCategory.create({ restaurant: restaurant._id, name: 'Sides & Appetizers', sortOrder: 0, isActive: true });
    const drinks = await MenuCategory.create({ restaurant: restaurant._id, name: 'Beverages', sortOrder: 2, isActive: true });
    const desserts = await MenuCategory.create({ restaurant: restaurant._id, name: 'Desserts', sortOrder: 3, isActive: true });

    // Create Items
    const items = [
      // Pizzas
      { category: pizzas._id, name: 'Margherita', price: 350, foodType: 'veg', prepTime: 15, desc: 'Classic tomato sauce, fresh mozzarella, basil.', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&fit=crop' },
      { category: pizzas._id, name: 'Pepperoni', price: 450, foodType: 'non_veg', prepTime: 15, desc: 'Tomato sauce, mozzarella, double pepperoni.', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&fit=crop' },
      { category: pizzas._id, name: 'BBQ Chicken', price: 480, foodType: 'non_veg', prepTime: 18, desc: 'BBQ sauce, mozzarella, grilled chicken, red onions.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&fit=crop' },
      { category: pizzas._id, name: 'Veggie Supreme', price: 400, foodType: 'veg', prepTime: 18, desc: 'Bell peppers, mushrooms, onions, black olives.', img: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=400&fit=crop' },
      { category: pizzas._id, name: 'Truffle Mushroom', price: 550, foodType: 'veg', prepTime: 20, desc: 'White sauce, mozzarella, roasted mushrooms, truffle oil.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&fit=crop' },
      
      // Sides
      { category: sides._id, name: 'Garlic Breadsticks', price: 150, foodType: 'veg', prepTime: 10, desc: 'Freshly baked sticks brushed with garlic butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&fit=crop' },
      { category: sides._id, name: 'Cheese Garlic Bread', price: 190, foodType: 'veg', prepTime: 12, desc: 'Garlic bread topped with melted mozzarella.', img: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&fit=crop' },
      { category: sides._id, name: 'Spicy Chicken Wings', price: 290, foodType: 'non_veg', prepTime: 15, desc: '6 pieces of crispy wings tossed in buffalo sauce.', img: 'https://images.unsplash.com/photo-1569691899455-88464f6d3ab1?w=400&fit=crop' },
      
      // Drinks
      { category: drinks._id, name: 'Classic Cola', price: 60, foodType: 'veg', prepTime: 2, desc: 'Chilled 330ml can.', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&fit=crop' },
      { category: drinks._id, name: 'Iced Lemon Tea', price: 90, foodType: 'veg', prepTime: 5, desc: 'Freshly brewed black tea with lemon and mint.', img: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&fit=crop' },
      
      // Desserts
      { category: desserts._id, name: 'Tiramisu', price: 220, foodType: 'veg', prepTime: 5, desc: 'Classic Italian dessert with espresso and mascarpone.', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&fit=crop' },
      { category: desserts._id, name: 'Chocolate Lava Cake', price: 180, foodType: 'veg', prepTime: 10, desc: 'Warm chocolate cake with a gooey molten center.', img: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&fit=crop' }
    ];

    const menuDocs = items.map((i, index) => ({
      restaurant: restaurant._id,
      category: i.category,
      name: i.name,
      description: i.desc,
      price: i.price,
      foodType: i.foodType,
      images: [{ url: i.img, public_id: `pizza_img_${index}` }],
      isActive: true,
      isAvailable: true,
      preparationTime: i.prepTime,
      sortOrder: index,
    }));

    await MenuItem.create(menuDocs);
    console.log(`Created ${menuDocs.length} menu items!`);

    console.log('\n✅ New Restaurant Successfully Added!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedPizza();
