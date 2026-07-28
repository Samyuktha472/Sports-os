require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
};

const seedData = async () => {
    await connectDB();
    await Resource.deleteMany({});

    await Resource.insertMany([
        // Equipment
        { type: 'equipment', name: 'Leather Balls — New', condition: 'Excellent', status: 'IN STOCK', quantity: 48, academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'equipment', name: 'Leather Balls — Old', condition: 'Practice', status: 'IN STOCK', quantity: 212, academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'equipment', name: 'Batting Tees', condition: 'Good', status: 'IN STOCK', quantity: 18, academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'equipment', name: 'Bowling Machines', condition: '1 maintenance', status: 'LOW', quantity: 3, academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'equipment', name: 'Stumps', condition: 'Good', status: 'IN STOCK', quantity: 24, academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'equipment', name: 'Cones', condition: 'Fair', status: 'IN STOCK', quantity: 50, academyName: 'Demo Academy (seed data — do not use in production)' },

        // Fees
        { type: 'fee', name: 'R. Gaikwad', athleteName: 'R. Gaikwad', feeMonth: 'June', feePaid: true, status: 'PAID', academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'fee', name: 'R. Jadeja', athleteName: 'R. Jadeja', feeMonth: 'June', feePaid: true, status: 'PAID', academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'fee', name: 'S. Iyer', athleteName: 'S. Iyer', feeMonth: 'June', feePaid: false, status: 'PENDING', academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'fee', name: 'Y. Chahal', athleteName: 'Y. Chahal', feeMonth: 'June', feePaid: true, status: 'PAID', academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'fee', name: 'M. Pathirana', athleteName: 'M. Pathirana', feeMonth: 'June', feePaid: false, status: 'PENDING', academyName: 'Demo Academy (seed data — do not use in production)' },
        { type: 'fee', name: 'I. Kishan', athleteName: 'I. Kishan', feeMonth: 'June', feePaid: true, status: 'PAID', academyName: 'Demo Academy (seed data — do not use in production)' },
    ]);

    console.log('✅ Resources seeded!');
    process.exit();
};

seedData();