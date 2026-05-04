const mongoose = require('mongoose');

const connect = async () => {
    try {
        const uri = 'mongodb://huaweiwebdev_db_user:TLsZMvXTrUI9OC8I@ac-f2cypvs-shard-00-00.w55j7m8.mongodb.net:27017,ac-f2cypvs-shard-00-01.w55j7m8.mongodb.net:27017,ac-f2cypvs-shard-00-02.w55j7m8.mongodb.net:27017/huawei_store?ssl=true&replicaSet=atlas-msnuhq-shard-0&authSource=admin&appName=Cluster0';
        
        await mongoose.connect(uri);
        console.log('✅ MongoDB Atlas connected successfully');
    } catch (err) {
        console.error('❌ Error connecting to MongoDB Atlas:', err.message);
        process.exit(1); 
    }
    
};

module.exports = connect;