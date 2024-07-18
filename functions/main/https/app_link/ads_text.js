const express = require("express");
const router = express.Router();
const path = require('path');
const filePath = path.join(__dirname, 'app-ads.txt');
const {logger} = require("firebase-functions");

router.get("/", async (request, response) => {
    logger.info(`API ads_text started`);
    response.set('Content-Type', 'text/plain; charset=utf-8');
    return response.status(200).sendFile(filePath);
});

module.exports = router;
