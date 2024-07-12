const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {logger} = require("firebase-functions");

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


router.post("/", verifyAppCheckToken, async (request, response) => {

    logger.info(`API password_authentication started`);
    const password = request.body.password || null;
    const userAccountId = request.body.userAccountId || null;
    logger.info(`User account id is ${userAccountId}`);


    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        phoneNumber: null,
        prefix: null,
    }

    if (password == null) {
        logger.warn(`Password is not supplied`);
        responseBody.message = `Password is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (userAccountId == null) {
        logger.warn(`User account id is not supplied`);
        responseBody.message = `User account id is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const validationResponse = validatePassword(password);

    if (validationResponse != null) {
        logger.warn(`Password did not pass the validation`);
        responseBody.message = validationResponse;
        response.status(400).send(responseBody);
        return
    }

    //hash the password
    const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();

    if (!passwordQueryResult.exists) {
        logger.warn(`Password document does not exists`);
        responseBody.message = `User does not exist in the server.`;
        response.status(400).send(responseBody);
        return
    }

    const passwordData = passwordQueryResult.data();
    const serverHash = passwordData.hash;

    try {
        logger.info(`Password about to be compared`);
        const match = await bcrypt.compare(password, serverHash);
        if (match) {
            // Password matches
            logger.info(`Password matches`);
            const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
            const userProfileQueryRef = admin.firestore().doc(userProfilePath);
            const userProfileQueryResult = await userProfileQueryRef.get();

            if (!userProfileQueryResult.exists) {
                logger.warn(`User profile document does not exists`);
                responseBody.message = `Account does not exists.`;
                response.status(400).send(responseBody);
                return
            }

            const userProfileData = userProfileQueryResult.data();
            const phoneNumber = userProfileData.phoneNumber;
            const phoneNumberPrefix = userProfileData.phoneNumberPrefix;

            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = phoneNumberPrefix;
            responseBody.message = `Authentication successful.`;
            response.status(200).send(responseBody);

        } else {
            // Password does not match
            logger.warn(`Password does not match`);
            responseBody.message = `Incorrect credential.`;
            response.status(400).send(responseBody);
        }
    } catch (error) {
        logger.error(`Password could not be matched with the server hash. Error is ${error.message}`);
        responseBody.message = `Failed to process the request.`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
