const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("=================================");
        console.log("MONGODB ATLAS CONNECTED!");
        console.log("Database:", connection.connection.name);
        console.log("Host:", connection.connection.host);
        console.log("=================================");

    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error);
        process.exit(1);
    }
};

module.exports = connectDB;