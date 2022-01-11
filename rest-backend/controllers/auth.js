const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
    //check for input errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, signup data is incorrect');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    try {
        const hashedPwe = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPwd
        });
        const result = await user.save();
        res.status(201).json({
            message: 'User created',
            userId: result._id
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ email: email });
        if(!user) {
            const error = new Error('User can not be found');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual) {
            const error = new Error('Wrong password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            }, 
            'my-secret-key',
            {
                expiresIn: '12h'
            }
        );
        res.status(200).json({
            token: token,
            userId: user._id.toString()
        });
        return;
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return(err);
    }    
}

exports.getUserStatus = (req, res, next) => {
    User.findById(req.userId)
    .then(user => {
        if(!user) {
            const error = new Error('User can not be found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            status: user.status
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.updateUserStatus = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    const newStatus = req.body.status;
    User.findById(req.userId)
    .then(user => {
        if(!user) {
            const error = new Error('User can not be found');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        return user.save();
    })
    .then(result => {
        res.status(200).json({
            message: 'User status updated'
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}