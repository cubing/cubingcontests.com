db = db.getSiblingDB('admin');
const results = db.events.findOne({ rank: 10, format: 'test' });
if (results) {
  print(results);
} else {
  print(db.events.findOne({ rank: 10, format: { $exists: true } }));
}
