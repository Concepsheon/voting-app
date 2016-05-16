var express = require('express');
var router = express.Router();

var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;

var Account = require("../models/account");
var Poll = require("../models/polls");

var jwt = require("jsonwebtoken");
var config = require("../config");

mongoose.connect(config.url, function(err,db){
    if(err){
        return console.log('failed to connect to database');
    }
    
    console.log('connected to database');
});

//configure passport
router.use(passport.initialize());
passport.use(new localStrategy(Account.authenticate()));

//jwt token

var token;
var decoded;

router.get('/', function(req, res, next) {
    
    
    
    Poll.find(function(err, polls){
        if(err){
            return console.log('no polls found', err);
        }
        
         res.render('index', {polls:polls});
        
    });
});

//register new user
router.get('/register', function(req,res){
    res.render('register');
});

router.post('/register', function(req,res){
    Account.register(new Account({username: req.body.username}), req.body.password, function(err, account){
        if(err){
            console.log('failed to register user', err);
            res.send(err);
        }
        
        console.log('registered new user', account.username);
        res.redirect('/');
    });
});


//view poll for authorized and unauthorized users

router.get("/users/polls/:id", function(req,res){
    
    var id = req.params.id;
    Poll.findById(id, function(err,poll){
        if(err){
            return console.log('could not find requested poll', err);
        }
        
        if(req.cookies.data){
            
            var data = JSON.parse(req.cookies.data);
            poll.data = data;
            poll.save(function(err,poll){
                if(err){
                    return console.log(err);
                }
            });
        }
        
        var labels = poll.labels;
        res.clearCookie('data');
        res.render('singles', {poll:poll, labels:JSON.stringify(labels)});
    });
});




/* PROTECTED ROUTES */

//login
router.post("/login", passport.authenticate('local', {session:false}), function(req,res){
    console.log("successful user login");
    token = jwt.sign({user:req.user.username}, config.secret);
    res.redirect('user/polls');
});

//jwt token passed to protected api end points
router.use(function(req,res,next){
    decoded = jwt.verify(token, config.secret);
    next();
});

//shows list of polls created by user
router.get("/user/polls", function(req,res){
    
    console.log(decoded);
    
    var query = Poll.find({createdBy: decoded.user});
    
    query.exec(function(err, polls){
        if(err){
            return console.log('no polls found by this user', err);
        }
        
        res.render('userhome', {user:decoded.user, polls:polls});
    });
});

//show single poll created by user
router.get("/user/:user/polls/:id", function(req,res){
    
    var id = req.params.id;
    Poll.findById(id, function(err,poll){
        if(err){
            return console.log('could not find requested poll', err);
        }
        
        var labels = poll.labels;
        
        res.render('userpolls', {poll:poll,  labels:JSON.stringify(labels)});
    });
});


//create new poll
router.get('/user/newpoll', function(req,res){
    res.render("create");
});

router.post('/user/newpoll', function(req,res){
    
    var poll = new Poll({
        title: req.body.title,
        labels: req.body.labels,
        createdBy: decoded.user
    });
    
    poll.save(function(err, newpoll){
        if(err){
            return console.log('could not save poll', err);
        }
        console.log(newpoll);
    });
    res.redirect('/user/polls');
});


//delete a poll
router.post("/user/delete/:id", function(req,res){
    
    var id = req.params.id;
    Poll.findByIdAndRemove(id, function(err,poll){
        if(err){
            return console.log("could noto find poll", err);
        }
        
        console.log('poll ' + poll.title + ' deleted');
        res.redirect('/user/polls');
    });
    
});


//logout remove user from req.user
router.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});


module.exports = router;
