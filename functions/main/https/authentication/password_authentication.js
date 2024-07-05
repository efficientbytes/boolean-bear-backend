const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

function validatePassword(password) {
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


router.post("/", async (request, response) => {

    const password = request.body.password || null;
    const userAccountId = request.body.userAccountId || null;

    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        phoneNumber: null,
        prefix: null,
    }

    if (password == null) {
        responseBody.message = `Password is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (userAccountId == null) {
        responseBody.message = `User account id is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const validationResponse = validatePassword(password);

    if (validationResponse != null) {
        responseBody.message = validationResponse;
        response.status(400).send(responseBody);
        return
    }

    //hash the password
    const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();

    if (!passwordQueryResult.exists) {
        responseBody.message = `User does not exist in the server.`;
        response.status(400).send(responseBody);
        return
    }

    const passwordData = passwordQueryResult.data();
    const serverHash = passwordData.hash;

    try {
        const match = await bcrypt.compare(password, serverHash);
        if (match) {
            // Password matches

            const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
            const userProfileQueryRef = admin.firestore().doc(userProfilePath);
            const userProfileQueryResult = await userProfileQueryRef.get();

            if (!userProfileQueryResult.exists) {
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

            responseBody.message = `Incorrect credential.`;
            response.status(400).send(responseBody);
        }
    } catch (err) {
        responseBody.message = `Failed to process the request.`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
