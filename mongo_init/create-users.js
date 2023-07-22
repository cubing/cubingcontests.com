db = db.getSiblingDB('cubingcontests');

db.createUser({
  user: process.env.MONGO_CC_USERNAME,
  pwd: process.env.MONGO_CC_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: 'cubingcontests',
    },
  ],
});
