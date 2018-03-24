/**
 * Created by dbroqua on 8/16/16.
 */

const mongoose = require('../../common').mongoose,
    bcrypt = require('bcrypt');

const SALT_WORK_FACTOR = 10,
    dataModel = {
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
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        apikey: {
            type: String,
            unique: true
        },
        active: {
            type: Boolean,
            default: true
        }
    };

let schema = new mongoose.Schema(dataModel, {
    versionKey: false,
    strict: true,
    timestamps: {
        createdAt: 'created_at'
    }
});

schema.pre('save', function(next) {
    let that = this;

    if (!that.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(that.password, salt, function(err, hash) {
            if (err) {
                return next(err);
            }

            that.password = hash;
            next();
        });
    });
});

/**
 * Compare password function
 * @param {String} candidatePassword
 * @param {Function} cb
 */
schema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = {
    model: mongoose.model('users', schema),
    dataModel: dataModel,
    bcrypt: bcrypt,
    SALT_WORK_FACTOR: SALT_WORK_FACTOR
};