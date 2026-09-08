const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
if(!MONGO_URI){
    console.error("missing mongo_uri");
    process.exit(1);
}

const mongoosOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000, 
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10
}


const connectdb = async () =>{
    try{
        await mongoose.connect(MONGO_URI, mongoosOptions);
        console.log("mongoose connected succesfully");
        return mongoose.connection;
    }catch(error){
        console.error("error");
        console.error(error.message);
        process.exit(1);
    }
};

mongoose.connection.on('error' , (error) =>{
    console.error('mongoose connection error', error.message);
});

mongoose.connection.on('error' , () =>{
    console.warn("mongodb dosconnected")
});

process.on('SIGINT' , async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to process termination');
});

const shutDown = async () => {
    Console.log(`\n${signal} receive: closing the mongodb conenctions`);
    
    try{
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);

    }catch(error){
        console.error("error message", error.message);
        process.exit(1);
    }
};
process.on("SIGNINT", () => shutDown('SIGNINT'));
process.on("SIGTERM", () => shutDown('SIGNTERM'));


if(require.main === module){
    connectdb();
}

module.exports =  {
    connectdb,
}
