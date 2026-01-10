// const mongoose =require("mongoose");
// const initData=require("./data.js");
// const listing=require("../models/listing.js");
// require("dotenv").config();
// main()
// .then(()=>{
//     console.log("connection successful")
// })

// .catch(err => console.log(err));
//   async function main() {
//   //await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
//   await mongoose.connect(process.env.ATLASDB_URL);


// }
// const initDB=async()=>{
//     await listing.deleteMany({});
//    const updatedData = initData.data.map((obj) => ({
//     ...obj,
//     owner: "685bbfb85c634d7fa85b53fa",
//   }));

//   await listing.insertMany(updatedData);
//   console.log("Data inserted successfully:");
// }

// initDB();



const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js"); // make sure this path is correct
require("dotenv").config();

main()
  .then(() => {
    console.log("Connection successful");
    return initDB();
  })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://nayan_dhamane:DCLPfMEfkgetqDZd@cluster0.zzwbrca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
}

const initDB = async () => {
  // 1. Find the user with username "nayan"
  const nayanUser = await User.findOne({ username: "nayan" });
  if (!nayanUser) {
    console.error("User with username 'nayan' not found!");
    process.exit(1);
  }

  // 2. Clear existing listings
  await Listing.deleteMany({});

  // 3. Assign 'nayan' as owner for all seed data
  const updatedData = initData.data.map((obj) => ({
    ...obj,
    owner: nayanUser._id,
  }));

  // 4. Insert updated listings
  await Listing.insertMany(updatedData);
  console.log("Data inserted successfully with owner 'nayan'");
};
