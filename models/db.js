let mongoose = require('mongoose')

// 连接MongoDB数据库
mongoose.connect('mongodb://127.0.0.1:27017/dumall') // 本地数据库
// mongoose.connect('mongodb://116.85.50.89:27017/dumall') // 远程数据库
// 监听连接状态
mongoose.connection.on('connected',function(){
    console.log('MongoDB connected success.');
})
mongoose.connection.on('error',function(){
    console.log('MongoDB connected fail.');
})
mongoose.connection.on('disconnected',function(){
    console.log('MongoDB connected disconnected.');
})

// 导出mongoose对象
module.exports = mongoose