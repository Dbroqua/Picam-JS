/**
 * Created by dbroqua on 8/16/16.
 */

var mongoose = require('../../common').mongoose,
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

var dataModel = {
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    mail: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    apikey: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
};

var schema = new mongoose.Schema(dataModel, {versionKey: false, strict: true, timestamps: {createdAt: 'created_at'}});

schema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                return next(err);
            }

            user.password = hash;
            next();
        });
    });
});

schema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = {
    model: mongoose.model('users', schema),
    dataModel: dataModel
};