var mongoose = require('./db')

var produtSchema = new mongoose.Schema ({
    "productId": Number,
    "productName": String,
    "productPrice": Number,
    "productImgUrl":String
})
module.exports = mongoose.model("Good",produtSchema)