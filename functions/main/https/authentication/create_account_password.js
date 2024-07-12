const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const bcrypt = require('bcrypt');
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");
const {logger} = require('firebase-functions');

function validatePassword(password) {
    logger.info(`Function validatePassword started`);
    if (!password) {
        return "Password cannot be empty.";
    }
    if (password.length < 12) {
        return "Password must be at least 12 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[$#@_!]/.test(password)) {
        return "Password must contain at least one special character: $#@_!";
    }
    return null;
}

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    logger.info(`API create_account_password started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id ${userAccountId}`);

    const password = request.body.password || null;

    const responseBody = {
        message: null,
    };

    if (password == null) {
        logger.warn(`Password is not supplied`);
        responseBody.message = `Password is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const validationResponse = validatePassword(password);

    if (validationResponse != null) {
        logger.warn(`Password did not pass the validations`);
        responseBody.message = validationResponse;
        response.status(400).send(responseBody);
        return
    }

    const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();

    if (passwordQueryResult.exists) {
        logger.warn(`Password was already created`);
        responseBody.message = `Password was already created.`;
        response.status(400).send(responseBody);
        return
    }

    //hash the password
    try {
        logger.info(`Password about to be hashed`);
        const saltRounds = 12
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        logger.info(`Password has been hashed`);

        const time = admin.firestore.FieldValue.serverTimestamp();
        await passwordRef.set({
            hash: hashedPassword,
            createdOn: time,
            updatedOn: time,
        }).then(result => {
            logger.info(`Password created`);
            responseBody.message = `Password has been successfully set and stored securely.`;
            response.status(200).send(responseBody);
        }).catch(error => {
            logger.error(`Password could not be created. Error is ${error.message}`);
            responseBody.message = error.message;
            response.status(500).send(responseBody);
        });

    } catch (err) {
        logger.error(`Password could not be created. Error is ${err.message}`);
        responseBody.message = `Failed to accept the password.`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
