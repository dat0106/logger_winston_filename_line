const express = require('express');
const logger = require('./logger');
const app = express();
const port = 3000;

app.get('/', function(req, res) {
    res.send("Hello World");
})

app.listen(port, function(error) {
    if (error) {
        logger.error("Something went wrong");
    }

    
    logger.debug("time taken");

    logger.verbose("time taken");
    logger.http("time taken");
    logger.warn("time taken");
    
    logger.info('hello', { value: 'world' });
    logger.info('hello', { value: 'world' }, { value: 'world' });
    logger.info(undefined);
    logger.info(null);
    logger.info({});
    logger.info("dat");
    logger.info(1334);
    console.log("server is running port:  " + port);
})