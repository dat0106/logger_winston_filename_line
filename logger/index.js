// NOTE: this adds a filename and line number to winston's output
// Example output: 'info (routes/index.js:34) GET 200 /index'

const winston = require('winston')
const { format, createLogger, transports } = winston;
const { timestamp, combine, printf, errors } = format;
var path = require('path')
var PROJECT_ROOT = path.join(__dirname, '../')

function rest(info) {
    if (info.stack != undefined) {
        return info.stack
    }
    if (info[Symbol.for('splat')] != undefined) {
        return info[Symbol.for('splat')].map(x => {
            if (typeof x === 'object') {
                return JSON.stringify(x)
            }
            return x
        }).join(', ')
    } else {
        return ""
    }
    // var filterValue = Object.assign({}, info, {
    //         level: undefined,
    //         message: undefined,
    //         splat: undefined,
    //         label: undefined,
    //         timestamp: undefined,
    //     })
    //     // o day neu la error thi print stack trace 
    // if (info.stack === undefined) {
    //     return JSON.stringify(filterValue, null, 3);
    // } else {
    //     return filterValue.stack;

    // }
}

const formatStr = printf(info => {
    return `${info.timestamp} ${info.level} ${info.message} ${rest(info)}`
});

if (process.env.NODE_ENV === 'development') {
    logger = winston.createLogger({
        // format: logger.format.json(),
        format: combine(
            winston.format.colorize(),
            winston.format.prettyPrint(),
            timestamp({ format: 'HH:mm:ss' }),
            formatStr
        ),
        transports: [
            new transports.Console({ level: 'debug' }),
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'logfile.log' }),
        ]
    });
} else {
    logger = logger.createLogger({
        // format: logger.format.json(),
        transports: [
            new logger.transports.Console(),
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'logfile.log' }),
        ]
    });
}

// logger.format = format.combine(
//     format.timestamp(),
//     format.printf(info => {
//             return `${info.timestamp} ${info.level} ${info.message}`
//         }

//     )
// )
// logger.transports = [
//         new logger.transports.Console()
//     ]
// this allows winston to handle output from express' morgan middleware
logger.stream = {
    write: function(message) {
        logger.info(message)
    }
}

// A custom logger interface that wraps winston, making it easy to instrument
// code and still possible to replace winston in the future.

module.exports.debug = module.exports.log = function() {
    logger.debug.apply(logger, formatLogArguments(arguments))
}

module.exports.http  = function() {
    logger.http.apply(logger, formatLogArguments(arguments))
}
module.exports.verbose  = function() {
    logger.verbose.apply(logger, formatLogArguments(arguments))
}
module.exports.info = function() {
    logger.info.apply(logger, formatLogArguments(arguments))
}

module.exports.warn = function() {
    logger.warn.apply(logger, formatLogArguments(arguments))
}

module.exports.error = function() {
    logger.error.apply(logger, formatLogArguments(arguments))
}

module.exports.stream = logger.stream

// module.exports = buildDevLogger()

/**
 * Attempts to add file and line number info to the given log arguments.
 */
function formatLogArguments(args) {
    args = Array.prototype.slice.call(args)
    var stackInfo = getStackInfo(1)

    if (stackInfo) {
        // get file path relative to project root
        var calleeStr = '[' + stackInfo.relativePath + ':' + stackInfo.line + ']'

        if (typeof(args[0]) === 'string') {
            args[0] = calleeStr + ' ' + args[0]
        } else {
            args.unshift(calleeStr)
        }
    }
    return args
}

/**
 * Parses and returns info about the call stack at the given index.
 */
function getStackInfo(stackIndex) {
    // get call stack, and analyze it
    // get all file, method, and line numbers
    var stacklist = (new Error()).stack.split('\n').slice(3)

    // stack trace format:
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
    var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
    var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

    var s = stacklist[stackIndex] || stacklist[0]
    var sp = stackReg.exec(s) || stackReg2.exec(s)

    if (sp && sp.length === 5) {
        return {
            method: sp[1],
            relativePath: path.relative(PROJECT_ROOT, sp[2]),
            line: sp[3],
            pos: sp[4],
            file: path.basename(sp[2]),
            stack: stacklist.join('\n')
        }
    }
}