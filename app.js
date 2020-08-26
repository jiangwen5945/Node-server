

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const ejs = require('ejs');

const indexRouter = require('./routes/index');
const goodsRouter = require('./routes/goods');
const usersRouter = require('./routes/users');

const app = express();
// 自定义跨域中间件
const allowCors = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
    next();
};
app.use(allowCors);//使用跨域中间件



// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.engine('.html', ejs.__express)
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // 指定server端静态目录

// 用户登陆拦截
app.use((req, res, next) => {
    if (req.cookies.userId) {
        next()
    } else {
        const ignoreList = [
            '/users/login',
            '/users/logout',
            '/users/register',
            '/users/checkLogin',
            '/goods/list',
            '/goods/productDefault'
        ]
        let reqPath = req.path   // 获取请求的url
        // 存在忽略白名单则继续向下执行
        if (ignoreList.indexOf(reqPath) !== -1) {
            next()
        } else {
            res.json({
                status: '10001',
                msg: '当前未登录',
                result: ''
            })
        }
    }
})


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/goods', goodsRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
