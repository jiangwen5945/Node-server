var mongoose = require('./db')

let userSchema = new mongoose.Schema({
    "userId": Number,
    "userName": String,
    "userPwd": String,
    "tel":String,
    "email": String,
    "orderList": [
        {

        }
    ],
    "cartList": [
        {
            "productId": Number,
            "productName": String,
            "productPrice": Number,
            "productImgUrl": String,
            // 购物车勾选及增加同种商品数量需要用到的字段
            "checked": String,
            "productNum": Number
        }
    ],
    "addressList": [
        {
            "addressId": Number,
            "consignee": String,
            "addressName": String,
            "postCode": String,
            "tel": String,
            "isDefault": Boolean
        }
    ]
})
module.exports = mongoose.model("User", userSchema)