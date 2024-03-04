const {onRequest} = require("firebase-functions/v2/https");
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).send(`Welcome Android Now`);
})

module.exports = router;