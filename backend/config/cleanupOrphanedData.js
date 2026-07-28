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

const query = { $or: [{ academyName: { $exists: false } }, { academyName: null }] };

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set. Please set it in environment or .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const counts = {};
  let total = 0;
  for (const [name, Model] of Object.entries(models)) {
    try {
      const c = await Model.countDocuments(query);
      counts[name] = c;
      total += c;
      console.log(`${name}: ${c} orphaned documents (missing or null academyName)`);
    } catch (err) {
      console.error(`Error counting ${name}:`, err.message);
      counts[name] = -1;
    }
  }

  if (total === 0) {
    console.log('No orphaned documents found. Nothing to delete.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const autoYes = process.argv.includes('--yes') || process.argv.includes('-y');
  if (!autoYes) {
    process.stdout.write(`About to delete ${total} orphaned documents across ${Object.keys(models).length} collections. Type YES to confirm: `);
    const input = await new Promise(resolve => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', d => resolve(d.toString().trim()));
    });
    if (input !== 'YES') {
      console.log('Aborted by user. No documents were deleted.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  for (const [name, Model] of Object.entries(models)) {
    try {
      const del = await Model.deleteMany(query);
      console.log(`${name}: deleted ${del.deletedCount} documents`);
    } catch (err) {
      console.error(`Error deleting ${name}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('Cleanup complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
