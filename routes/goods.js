const express = require('express')
const router = express.Router()
const Goods = require("../models/goods")
const type2_goods = require("../models/type2_goods")
// 查询商品库数据
router.get("/list", function (req, res, next) {
    let sort = req.param("sort"),
        page = parseInt(req.param("page")),
        pageSize = parseInt(req.param("pageSize")),
        skip = (page - 1) * pageSize,
        typeId = req.param('typeId'), // 不同商品类型
        // 商品价格过滤参数
        priceLevel = req.param('priceLevel'),
        priceGt = '',
        priceLte = '',
        params = {};
    if (priceLevel != undefined) {
        switch (priceLevel) {
            case '0':
                priceGt = 0;
                priceLte = 50;
                break;
            case '1':
                priceGt = 50;
                priceLte = 100;
                break;
            case '2':
                priceGt = 100;
                priceLte = 150;
                break;
            case '3':
                priceGt = 150;
                priceLte = Number.MAX_VALUE;
                break;
        }

        params = {
            price: {
                $gt: priceGt,
                $lte: priceLte
            }
        }
    }

    let goodsModel;
    // 选择查询不同商品库
    switch (typeId) {
        case '1':
            goodsModel = Goods.find(params).skip(skip).limit(pageSize);
            break;
        case '2':
            goodsModel = type2_goods.find(params).skip(skip).limit(pageSize);
            break;
        default:
            goodsModel = Goods.find(params).skip(skip).limit(pageSize);
            break;
    }
    // 根据商品价格排序
    if (sort !== undefined) {
        goodsModel.sort({'productPrice': parseInt(sort)})
    }
    goodsModel.exec(function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            res.json({
                status: '0',
                msg: '200',
                result: {
                    count: doc.length,
                    list: doc,
                    title: '默认模块名'
                }
            })
        }
    })
})

// 查询商品详情
router.get('/productDefault', (req, res, next) => {
    let productId = req.param("productId")
    Goods.findOne({productId:productId}).exec((err,doc)=>{
        if (err){
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        }else {
            res.json({
                status: '0',
                msg: '',
                result: doc
            })
        }
    })

})

// 加入购物车
router.post("/addCart", function (req, res, next) {
    let userId = req.cookies.userId
    let productId = req.body.productId
    let User = require('../models/users')

    // 查找用户数据库中对应用户ID
    User.findOne({userId: userId}, function (err, userDoc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
            })
        } else {
            if (userDoc) {
                // 判断该商品是否存在购物车
                let isInnerCart = ''
                userDoc.cartList.forEach(item => {
                    // 如果用户购物车列表中已存在该商品则数量加1
                    if (item.productId === productId) {
                        isInnerCart = item;
                        item.productNum++
                    }
                })
                // 购物车不存在该商品时
                if (!isInnerCart) {
                    // 查找商品数据库中对应商品ID
                    Goods.findOne({productId: productId}, function (err2, productDoc) {
                        if (err2) {
                            res.json({
                                status: '1',
                                msg: err2.message,
                            })
                        } else {
                            if (productDoc) {
                                // productDoc.productNum = '1';
                                // productDoc.checked = 1;
                                // TODO：(坑)虽然我们给schema附加属性，但是这并没有添加到schema中。
                                // 方法一： 给schema附加属性后，需要在good模型内的Schema添加这两个属性
                                // 方法二： 创建一个临时变量对象进行数据添加（建议）
                                let fooProductDoc = {
                                    productId: productDoc.productId,
                                    productName: productDoc.productName,
                                    productPrice: productDoc.productPrice,
                                    productImgUrl: productDoc.productImgUrl,
                                    productNum: 1,
                                    checked: '1'
                                }

                                userDoc.cartList.push(fooProductDoc) // 添加用户购物车对象数据

                                userDoc.save((err3, doc3) => { // 保存至用户数据库
                                    if (err3) {
                                        res.json({
                                            status: '1',
                                            msg: err3.message,
                                        })
                                    } else {
                                        res.json({
                                            status: '0',
                                            msg: '',
                                            result: "success"
                                        })
                                    }
                                })
                            }
                        }
                    })
                } else {
                    userDoc.save((err3, doc) => {
                        if (err3) {
                            res.json({
                                status: '1',
                                msg: err3.message,
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: '',
                                result: "success"
                            })
                        }
                    })

                }

            }
        }
    })
})


// 导出
module.exports = router