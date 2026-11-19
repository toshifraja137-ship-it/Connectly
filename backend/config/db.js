const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongoDO connected successfully!");
    }

    catch (error) {
        console.error("MongoDb failed to connect:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;