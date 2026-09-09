const mongoose = require("mongoose");
require("dotenv").config();

const getMongoUri = () => {
    return (
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        ""
    ).trim();
};

const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
};


const connectdb = async () =>{
    const MONGO_URI = getMongoUri();

    if(!MONGO_URI){
        const error = new Error(
            "MONGO_URI is not configured. Set MONGO_URI in your .env file."
        );
        console.error(error.message);
        throw error;
    }

    try{
        await mongoose.connect(MONGO_URI, mongooseOptions);
        console.log("mongoose connected succesfully");
        return mongoose.connection;
    }catch(error){
        console.error("MongoDB connection error:");
        console.error(error.message);
        throw error;
    }
};

mongoose.connection.on('error' , (error) =>{
    console.error('mongoose connection error', error.message);
});

mongoose.connection.on('disconnected' , () =>{
    console.warn("mongodb disconnected")
});

const shutDown = async (signal) => {
    console.log(`\n${signal} received: closing the mongodb connections`);
    
    try{
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);

    }catch(error){
        console.error("error message", error.message);
        process.exit(1);
    }
};
process.on("SIGINT", () => shutDown('SIGINT'));
process.on("SIGTERM", () => shutDown('SIGTERM'));


if(require.main === module){
    connectdb();
}

module.exports =  {
    connectdb,
}
