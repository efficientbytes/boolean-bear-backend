const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

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

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

router.post("/", verifyAppCheckToken, async (request, response) => {

    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Authentication required.`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

    const password = request.body.password || null;

    const responseBody = {
        message: null,
    };

    if (password == null) {
        responseBody.message = `Password is not provided`;
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
        responseBody.message = `Identity could not be verified.`;
        response.status(400).send(responseBody);
        return
    }

    const passwordData = passwordQueryResult.data();
    const serverHash = passwordData.hash;

    try {
        const match = await bcrypt.compare(password, serverHash);
        if (match) {
            // New password cannot be same as the old password
            responseBody.message = `New password cannot be same as the old password`;
            response.status(400).send(responseBody);
        } else {
            // Proceed with hashing and save it in database
            try {
                const saltRounds = 12
                const salt = await bcrypt.genSalt(saltRounds);
                const hashedPassword = await bcrypt.hash(password, salt);

                const time = admin.firestore.FieldValue.serverTimestamp();
                await passwordRef.update({
                    hash: hashedPassword,
                    updatedOn: time,
                }).then(result => {
                    responseBody.message = `Password has been successfully updated.`;
                    response.status(200).send(responseBody);
                }).catch(error => {
                    responseBody.message = error.message;
                    response.status(500).send(responseBody);
                });

            } catch (err) {
                responseBody.message = `Failed to accept the password.`;
                response.status(500).send(responseBody);
            }

        }
    } catch (err) {
        responseBody.message = `Failed to accept the password.`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
