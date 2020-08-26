const express = require('express')
const router = express.Router()
// 引入用户数据mongoose模型
const Users = require("../models/users")
const common = require("../util/common")
const utility = require("utility"); // 用户密码加密处理


router.get("/", function (req, res, next) {
    Users.find({}, function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message
            })
        } else {
            res.json({
                status: '0',
                msg: '',
                result: {
                    count: doc.length,
                    list: doc

                }
            })
        }
    })
})

// 用户注册
router.post('/register', (req, res, next) => {
    let userName = req.body.userName,
        // userPwd = req.body.password,
        userPwd = utility.md5(req.body.password),
        tel = req.body.tel,
        email = req.body.email


    // 查询现有用户
    Users.find({}, (err, userDoc) => {
        //
        if (userDoc) {
            // 设置用户ID
            let userId = parseInt(userDoc.slice(-1)[0]['userId']) + 1
            // 检测用户名已存在
            let isExisted = userDoc.some(e => {
                return e.userName === userName
            })
            if (isExisted) {
                res.json({
                    status: '10001',
                    msg: '用户名已存在',
                    result: ''
                })
            } else {
                // 添加用户
                Users.create({
                    userId: userId,
                    userName: userName,
                    userPwd: userPwd,
                    tel: tel,
                    email: email,
                    orderList: [],
                    cartList: [],
                    addressList: []
                }, (err2, doc) => {
                    if (err2) {
                        res.json({
                            status: '10002',
                            msg: err2.msg,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: '注册成功'
                        })
                    }
                })
            }


        }
    })


})

// 用户登陆
router.post("/login", (req, res, next) => {
    let params = {
        userName: req.body.userName,
        userPwd: utility.md5(req.body.userPwd),
    }
    Users.findOne(params, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: {
                    count: doc.length,
                    list: doc
                }
            })
        } else {
            if (doc) {
                // 设置cookie
                res.cookie("userId", doc.userId, {
                    path: '/',
                    maxAge: 1000 * 60 * 60 * 24
                })
                res.cookie("userName", doc.userName, {
                    path: '/',
                    maxAge: 1000 * 60 * 60 * 24
                })
                // 发送响应
                res.json({
                    status: '0',
                    msg: '',
                    result: doc
                })
            } else {
                res.json({
                    status: '1',
                    msg: '用户名或密码错误'
                })
            }
        }
    })
})

// 修改用户密码
router.post('/editInfo', (req, res, next) => {
    let conditions = {
            userId: req.cookies.userId,
            userPwd: utility.md5(req.body.oldUserPwd)
        },
        update = {
            userPwd: utility.md5(req.body.newUserPwd)
        }

    // 检测原密码是否一致
    Users.findOneAndUpdate(conditions, update, (err, doc) => {
        if (err) {
            res.json({
                status: '11',
                msg: err.message,
                result: '修改失败'
            })
        } else {
            if (doc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: '修改成功'
                })
            } else {
                res.json({
                    status: '11',
                    msg: '原密码错误',
                    result: '原密码错误'
                })
            }
        }
    })

})

// 用户登出
router.post("/logout", (req, res, next) => {
    res.cookie("userId", '', {
        path: '/',
        maxAge: -1
    })
    res.json({
        status: '0',
        msg: '退出成功',
        result: ''
    })
})

// 登陆校验
router.get('/checkLogin', (req, res, next) => {
    //  如果请求存在登陆时存入的userId且未过期，说明已登陆
    if (req.cookies.userId) {
        res.json({
            status: '0',
            msg: '',
            result: req.cookies.userName || ''
        })
    } else {
        res.json({
            status: '1',
            msg: '未登录',
            result: ''
        })
    }
})

// 获取用户购物车列表
router.post("/cartList", (req, res, next) => {
    let userId = req.cookies.userId
    Users.findOne({userId: userId}, function (err, userDoc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: userDoc.cartList
                })
            }
        }
    })

})

// 获取用户所有信息
router.post("/userInfo", (req, res, next) => {
    let userId = req.cookies.userId
    Users.findOne({userId: userId}, function (err, userDoc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: userDoc
                })
            }
        }
    })

})

// 删除用户购物车数据
router.post("/cartList/del", (req, res, next) => {
    let userId = req.cookies.userId,
        productId = req.body.productId
    Users.update({userId: userId}, {$pull: {'cartList': {'productId': productId}}}, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            res.json({
                status: '0',
                msg: '',
                result: 'success'
            })
        }
    })
})

// 修改用户购物车数据
router.get('/cartList/edit', (req, res, next) => {
    let userId = req.cookies.userId,
        productId = req.param('productId'),
        productNum = req.param('productNum'),
        checked = req.param('checked'),
        allChecked = req.param('allChecked')
    // 处理批量文档全选操作
    if (allChecked !== undefined) {
        Users.findOne({userId: userId}, (err, userDoc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                if (userDoc) {
                    userDoc.cartList.forEach(item => {
                        item.checked = allChecked === 'true' ? '1' : '-1'
                    })
                    userDoc.save((err2, doc) => {
                        if (err2) {
                            res.json({
                                status: '1',
                                msg: err.message,
                                result: ''
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: '',
                                result: 'success'
                            })
                        }
                    })
                }

            }
        })
    }
    // 处理单文档勾选和修改数量
    if (allChecked === undefined) {
        Users.update({'userId': userId, "cartList.productId": productId}, {
            "cartList.$.productNum": productNum,
            "cartList.$.checked": checked
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                console.log(doc)
                res.json({
                    status: '0',
                    msg: '',
                    result: 'success'
                })
            }
        })
    }

})

// 获取用户收货地址列表
router.post("/addressList", (req, res, next) => {
    let userId = req.cookies.userId
    Users.findOne({userId: userId}, (err, userDoc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: userDoc.addressList
                })
            }
        }

    })

})

// 新增地址
router.get("/newAddress", (req, res, next) => {
    let userId = req.cookies.userId

    Users.findOne({userId: userId}, (err, userDoc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                // 新增用户地址
                let len = userDoc.addressList.length ? userDoc.addressList.length : 1, // 避免为长度为0时创建订单号下标越界
                    address = {
                        addressId: userDoc.addressList[len - 1] ? userDoc.addressList[len - 1].addressId + 1 : 1000, // 避免删除订单后id相同及设置初始化id
                        consignee: req.param("consignee"),
                        addressName: req.param("addressName"),
                        postCode: req.param("postCode"),
                        tel: req.param("tel"),
                        isDefault: false
                    }
                userDoc.addressList.push(address)
                userDoc.save((err2, addressDoc) => {
                    if (err2) {
                        res.json({
                            status: '2',
                            msg: err.message,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: 'success'
                        })
                    }

                })
            }
        }
    })

})

// 修改地址
router.post("/addressList/edit", (req, res, next) => {
    let userId = req.cookies.userId,
        addressId = req.body.addressId,
        consignee = req.body.consignee,
        addressName = req.body.addressName,
        postCode = req.body.postCode,
        tel = req.body.tel,
        isDefault = req.body.isDefault || false

    Users.update({userId: userId, "addressList.addressId": addressId}, {
        "addressList.$.consignee": consignee,
        "addressList.$.addressName": addressName,
        "addressList.$.postCode": postCode,
        "addressList.$.tel": tel,
        "addressList.$.isDefault": isDefault
    }, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'success'
                })
            }
        }
    })

})

// 设置默认地址
router.get('/addressList/setDefault', (req, res, next) => {
    let userId = req.cookies.userId,
        addressId = req.param('addressId')

    Users.findOne({userId: userId}, (err, userDoc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                userDoc.addressList.forEach(item => {
                    if (item.addressId == addressId) {
                        item.isDefault = true
                    } else {
                        item.isDefault = false
                    }
                })
                userDoc.save((err2, doc) => {
                    if (err2) {
                        res.json({
                            status: '1',
                            msg: err.message,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: 'success'
                        })
                    }
                })


            }
        }
    })

})

// 删除地址
router.get("/addressList/del", (req, res, next) => {
    let userId = req.cookies.userId,
        addressId = req.param('addressId')
    Users.update({userId: userId}, {$pull: {"addressList": {"addressId": addressId}}}, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            res.json({
                status: '0',
                msg: '',
                result: 'success'
            })
        }
    })
})

// 创建订单
router.post("/createOrder", (req, res, next) => {
    let userId = req.cookies.userId,
        addressId = req.body.addressId,
        orderTotal = req.body.orderTotal
    // TODO: 订单金额后台需要重新计算验证

    Users.findOne({userId: userId}, (err, userDoc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (userDoc) {
                // 定义参数
                let addressInfo = {},
                    goodsList = []
                // 获取当前用户默认地址
                userDoc.addressList.forEach(e => {
                    // 判断传入的地址ID一致，且为当前默认地址
                    if (e.addressId == addressId && e.isDefault) {
                        addressInfo = e
                    }
                })
                // 获取当前用户购物车中确定的购买商品,并且在购物车中移除该商品
                userDoc.cartList.filter((e, i, arr) => {
                    if (e.checked == '1') {
                        goodsList.push(e)
                        arr.splice(i, 1)
                    }
                })

                // 创建订单数据并添加到该用户订单列表
                let platCode = '688', // 平台码
                    r1 = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000, // 生成100-999的随机数
                    orderId = platCode + r1 + new Date().valueOf(),
                    createDate = common.dateFormat("yyyy-MM-dd hh:mm:ss", new Date())

                let order = {
                    orderId: orderId,
                    orderTotal: orderTotal,
                    addressInfo: addressInfo,
                    goodsList: goodsList,
                    orderStatus: '1',
                    createDate: createDate, // 创建时间
                    payDate: '',            // 支付时间
                }

                userDoc.orderList.push(order)


                // 保存文档
                userDoc.save((err2, doc) => {
                    if (err2) {
                        res.json({
                            status: '1',
                            msg: err2.message,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: {
                                orderId: order.orderId,
                                orderTotal: order.orderTotal
                            }
                        })
                    }
                })
            }

        }
    })
})

// 获取订单
router.get("/getOrder", (req, res, next) => {
    let userId = req.cookies.userId,
        orderId = req.param('orderId')
    Users.findOne({userId: userId}, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            let order = ''
            if (doc.orderList.length > 0) {
                // 获取所有订单
                if (orderId == 'all') {
                    res.json({
                        status: '0',
                        msg: '',
                        result: doc.orderList
                    })
                } else {
                    doc.orderList.forEach(e => {
                        if (e.orderId == orderId) {
                            order = e
                        }
                    })
                    res.json({
                        status: '0',
                        msg: '',
                        result: order
                    })
                }

            } else {
                res.json({
                    status: '10008',
                    msg: '无此订单',
                    result: ''
                })
            }

        }
    })
})

// 修改订单
router.get("/editOrder", (req, res, next) => {
    let userId = req.cookies.userId,
        orderId = req.param('orderId'),
        orderStatus = req.param('orderStatus')


    Users.update({userId: userId, 'orderList.orderId': orderId}, {
        "orderList.$.orderStatus": orderStatus,
    }, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'success'
                })
            }
        }
    })
})

// 验证订单状态（是否支付）
router.post("/checkPay", (req, res, next) => {
    let userId = req.cookies.userId,
        orderId = req.body.orderId,
        orderStatus = '',
        payDate = common.dateFormat("yyyy-MM-dd hh:mm:ss", new Date())
    // 模拟接口
    let mockCheck = (e) => {
        switch (e) {
            case 1: // 支付成功
                orderStatus = '2';
                break;
            case 0: // 支付失败
                orderStatus = '1';
                break;
        }
    }
    mockCheck(1)

    // 模拟3秒后返回支付状态
    Users.update({userId: userId, 'orderList.orderId': orderId}, {
        "orderList.$.orderStatus": orderStatus,
        "orderList.$.payDate": payDate
    }, (err, doc) => {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                res.json({
                    status: '0',
                    msg: 'paySuccess',
                    result: orderStatus
                })
            }
        }
    })


})

module.exports = router