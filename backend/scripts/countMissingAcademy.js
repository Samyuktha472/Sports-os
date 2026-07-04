const mongoose = require('mongoose');
require('dotenv').config();

const models = {
  Batch: require('../models/Batch'),
  Session: require('../models/Session'),
  Timetable: require('../models/Timetable'),
  Attendance: require('../models/Attendance'),
  CoachAttendance: require('../models/CoachAttendance'),
  Performance: require('../models/Performance'),
  Resource: require('../models/Resource'),
};

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment. Load .env or set MONGO_URI.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  for (const [name, Model] of Object.entries(models)) {
    try {
      const countMissing = await Model.countDocuments({ $or: [{ academyName: { $exists: false } }, { academyName: null }, { academyName: '' }] });
      console.log(`- ${name}: ${countMissing} documents missing academyName`);

      if (countMissing > 0) {
        const sample = await Model.find({ $or: [{ academyName: { $exists: false } }, { academyName: null }, { academyName: '' }] }).limit(5).lean();
        console.log('  Sample IDs:', sample.map(s => s._id.toString()).join(', '));
      }
    } catch (err) {
      console.error(`Error checking ${name}:`, err.message);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
