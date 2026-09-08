const mongoose = require("mongoose");
const dns = require("node:dns");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
if(!MONGO_URI){
    console.error("missing mongo_uri");
    process.exit(1);
}

const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000, 
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10
}


const getFallbackDnsServers = () =>
    (process.env.MONGO_DNS_SERVERS || "")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);

const connectdb = async () => {
    const dnsServers = getFallbackDnsServers();

    // Some local DNS resolvers block MongoDB SRV/TXT lookups. Configure the
    // resolver before Mongoose expands an Atlas mongodb+srv connection URI.
    if (MONGO_URI.startsWith("mongodb+srv://") && dnsServers.length) {
        dns.setServers(dnsServers);
    }

    try {
        await mongoose.connect(MONGO_URI, mongooseOptions);
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }

    console.log("MongoDB connected successfully");
    return mongoose.connection;
};

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
});

process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed due to process termination");
});


if(require.main === module){
    connectdb().catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
}

module.exports =  {
    connectdb,
}
