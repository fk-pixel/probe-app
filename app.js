require("dotenv").config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var mysql = require("mysql");
const { orderBy } = require("lodash")
const moment = require("moment")

// Start app
var app = express();
app.use(cors());

//DB connection
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER_NAME,
    password: process.env.USER_PASSWORD,
    database: process.env.USER_DB
});

// Connect
db.connect((err) => {
    if (err) {
        throw err
    }
    console.log("DB conected and port 8080")
});


/* ---------QUERY SET---------- */

/* SET1: Total summary sales */ 
// Get sum all time
app.get("/sum", (req, res) => {
    try {
        let sql = ` 
            SELECT s.created_at date, SUM(p.price) total 
            FROM sales_order_item s 
            RIGHT JOIN product p ON p.product_id = s.product_id 
            GROUP BY created_at 
            ORDER BY created_at DESC LIMIT 10;`
        let query = db.query(sql, (err, results) => {
            if (err) throw err;
            console.log(results)
            res.send("Sum sales here!")
        });
        } catch (error) {
            res.json()
    }
});
const query1 = (interval, res) => {
    try {
        let sql = ` 
            SELECT s.created_at date, SUM(p.price) total 
            FROM sales_order_item s
            INNER JOIN product p ON p.product_id = s.product_id 
            WHERE s.created_at>= DATE_SUB(CURDATE(), INTERVAL ${interval} DAY)
            GROUP BY s.created_at 
            ORDER BY s.created_at DESC;`
        db.query(sql, (err, results) => {
            if (err) throw err;
            //console.log(results)
            res.json(results)
        });
    } catch (error) {
        res.json(error)
    }
}

// Get sum lastday
app.get("/sum/lastday", (req, res) => {
    query1(1, res);    
});

// Get sum lastweek
app.get("/sum/lastweek", (req, res) => {
    query1(7, res);
});

// Get sum lastmonth
app.get("/sum/lastmonth", (req, res) => {
   query1(30, res);
});

/* SET2: Total sales by category */
// Get all categoric sales filtered
app.get("/category", (req, res) => {
    try {
        let sql = ` 
        SELECT s.created_at date, c.name category, SUM(p.price) sales 
        FROM category c 
        LEFT JOIN product p ON p.category_id = c.category_id 
        LEFT JOIN sales_order_item s ON s.product_id = p.product_id 
        GROUP BY c.name 
        ORDER BY sales DESC;`
        db.query(sql, (err, results) => {
            if (err) throw err;
            res.json(results)        
        })
    } catch (error) {
        res.json(error)
    }
});

const query2 = (interval, res) => {
    try {
        let sql = ` 
        SELECT s.created_at date, c.name category, SUM(p.price) sales 
        FROM category c 
        LEFT JOIN product p ON p.category_id = c.category_id 
        LEFT JOIN sales_order_item s ON s.product_id = p.product_id 
        WHERE s.created_at>= DATE_SUB(CURDATE(), INTERVAL ${interval} DAY)
        GROUP BY c.name 
        ORDER BY sales DESC
        LIMIT 6;`
        db.query(sql, (err, results) => {
            if (err) throw err;
            //console.log(results)
            res.json(results)
        });
    } catch (error) {
        res.json(error)
    }
}

// Get categoric sales lastday (most popular 6 category)
app.get("/category/lastday", (req, res) => {
    query2(1, res);
});

// Get categoric sales lastweek (most popular 6 category)
app.get("/category/lastweek", (req, res) => {
    query2(7, res);
});

// Get categoric sales lastmonth (most popular 6 category)
app.get("/category/lastmonth", (req, res) => {
    query2(30, res)
});

//Routes
var indexRouter = require('./routes/index');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.get("/favicon.ico", (req,res) => {
    res.status(204);
});

module.exports = app;
