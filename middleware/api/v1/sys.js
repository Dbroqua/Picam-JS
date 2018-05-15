/**
 * Created by dbroqua on 3/27/17.
 */

const os = require('os'),
    utils = require('os-utils'),
    disk = require('diskusage');

class Sys {
    static _disk(path, callback) {
        disk.check(path, function(err, info) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, {
                    available: info.available,
                    free: info.free,
                    total: info.total
                });
            }
        });
    }
    static _mem(callback) {
        let _total = os.totalmem(),
            _free = os.freemem();

        callback({
            total: _total,
            free: _free,
            used: _total - _free
        });
    }
    static _uptime(callback) {
        let _uptime = os.uptime(),
            _days = Math.floor(_uptime / 86400),
            _hours = Math.floor((_uptime - (_days * 86400)) / 3600),
            _minutes = Math.floor((_uptime - (_days * 86400 + _hours * 3600)) / 60);

        callback({
            days: _days,
            hours: _hours,
            minutes: _minutes
        });
    }
    static _cpu(callback) {
        utils.cpuUsage(function(value) {
            callback({
                usage: value
            });
        });
    }

    /**
     * Show summary information about the Pi
     * @param {Object} req
     * @param {Function} callback
     */
    static getAll(req, callback) {
        let that = this,
            _count = 5,
            _parsed = 0,
            _res = {
                disks: {
                    root: {},
                    boot: {}
                },
                cpu: null,
                memory: {},
                uptime: {}
            },
            _runCallback = function() {
                if (_count === _parsed) {
                    callback(null, {
                        code: 200,
                        res: _res
                    })
                }
            }

        that._cpu(function(cpus) {
            _res.cpu = {
                usage: Math.round(cpus.usage * 100)
            };
            _parsed++;
            _runCallback();
        });

        that._mem(function(memory) {
            _res.memory = memory;
            _parsed++;
            _runCallback();
        });

        that._uptime(function(uptime) {
            _res.uptime = uptime;
            _parsed++;
            _runCallback();
        });

        that._disk('/', function(err, info) {
            _res.disks.root = info;
            _parsed++;
            _runCallback();
        });

        that._disk('/boot', function(err, info) {
            _res.disks.boot = info;
            _parsed++;
            _runCallback();
        });
    }
}

module.exports = Sys;