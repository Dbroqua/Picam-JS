/**
 * Created by dbroqua on 8/16/16.
 */

var mongoose = require('../../common').mongoose,
    Schema = mongoose.Schema;

var dataModel = {
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    definition: {
        type: Object,
        scheme: {
            type: String
        },
        uri: {
            type: String
        },
        port: {
            type: Number
        },
        apikey: {
            type: String
        },
        cameraId: {
            type: Schema.Types.ObjectId
        },
        motion: {
            type: Object,
            id: {
                type: Number
            },
            adminUri: {
                type: String
            },
            streamUri: {
                type: String
            }
        },
        filesDirectory: {
            type: String
        },
        fileIntrustion: {
            type: String
        }
    },
    infos: {
        state: {
            type: String
        },
        detectionState: {
            type: String
        },
        lastDetection: {
            type: Date
        },
        startedAt: {
            type: Date
        },
        lastRun: {
            type: Date
        }
    }
};

var schema = new mongoose.Schema(dataModel, {versionKey: false, strict: true, timestamps: {createdAt: 'created_at'}});

module.exports = {
    model: mongoose.model('cameras', schema),
    dataModel: dataModel
};