const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

function generateHtml(title, caption) {
    logger.info(`Function generateHtml started`);
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification Success</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: rgba(173, 216, 230, 0.2); /* Light blue tint */
            }

            .message-box {
                background-color: white;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                font-family: 'Roboto', sans-serif;
                text-align: center;
            }

            .message-line1 {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .message-line2 {
                font-size: 18px;
            }
        </style>
        </head>
        <body>
        <div class="message-box">
            <p class="message-line1">${title}</p>
            <p class="message-line2">${caption}</p>
        </div>
        </body>
        </html>
    `;

    return htmlContent;
}

router.get("/", async (request, response) => {
    logger.info(`API verify_primary_mail started`);
    const emailAddress = request.query.emailAddress || null;
    logger.info(`Email address is ${emailAddress}`);
    const userAccountId = request.query.id || null;
    logger.info(`User account id is ${userAccountId}`);
    const verificationKey = request.query.publicKey || null;
    logger.info(`Verification key is ${verificationKey}`);

    const responseBody = {
        title: null,
        caption: null,
    };

    if (verificationKey == null) {
        logger.warn(`Verification key is not supplied`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `Verification key is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (userAccountId == null) {
        logger.warn(`User account is not supplied`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `User account id is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (emailAddress == null) {
        logger.warn(`Email address is not supplied`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `Email address is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    logger.info(`User is about to be authenticated`);
    //check if the user id is authenticated
    const userIdCheck = await admin
        .auth()
        .getUser(userAccountId)
        .then((result) => {
            logger.info(`User is authenticated`);
            return true;
        })
        .catch((error) => {
            logger.error(`User authentication could not be checked. Error is ${error.message}`);
            responseBody.title = `Verification Failed`;
            responseBody.caption = `User id is not authenticated.`;
            return false;
        });

    if (userIdCheck !== true) {
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(401).send(htmlContent);
        return;
    }

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userProfilePathRef = admin.firestore().doc(userProfilePath);
    const userProfilePathSnapshot = await userProfilePathRef.get();

    if (!userProfilePathSnapshot.exists) {
        logger.warn(`User profile document does not exists`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `User record doest not exists.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    //check if the emailId in the mail is same as the email id in the verification document

    const verificationId = verificationKey.substring(3);
    const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/${verificationId}`;
    const primaryMailVerificationRef = admin
        .firestore()
        .doc(primaryMailVerificationKeyPath);
    const primaryMailVerificationSnapshot =
        await primaryMailVerificationRef.get();

    if (!primaryMailVerificationSnapshot.exists) {
        logger.warn(`Primary email verification document does not exists`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `Verification credentials has either been used,expired or not valid.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    const primaryMailVerificationData = primaryMailVerificationSnapshot.data();
    const primaryMailVerificationUserAccountId =
        primaryMailVerificationData.userAccountId;
    const primaryMailVerificationEmailAddress =
        primaryMailVerificationData.emailAddress;
    const primaryMailVerificationVerificationKey =
        primaryMailVerificationData.key;

    if (
        verificationKey !== primaryMailVerificationVerificationKey &&
        emailAddress !== primaryMailVerificationEmailAddress &&
        userAccountId !== primaryMailVerificationUserAccountId
    ) {
        logger.warn(`Verification failed. Incorrect credentials`);
        responseBody.title = `Verification Failed`;
        responseBody.caption = `Incorrect verification credentials.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(500).send(htmlContent);
        return;
    }
    const time = admin.firestore.FieldValue.serverTimestamp();
    const updateResult = await userProfilePathRef
        .update({
            emailAddress: emailAddress,
            emailVerifiedOn: time,
            lastUpdatedOn: time,
        })
        .then(() => {
            logger.info(`User profile document updated`);
            return true;
        })
        .catch((error) => {
            logger.error(`User profile document could not be updated. Error is ${error.message}`);
            responseBody.title = `Verification Failed`;
            responseBody.caption = `${error.message}`;
            return false;
        });

    if (updateResult !== true) {
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(500).send(htmlContent);
        return;
    }

    logger.info(`User custom claims about to be modified`);
    const customClaim = {
        emailVerified: true,
    };

    await admin
        .auth()
        .setCustomUserClaims(userAccountId, customClaim)
        .then(async () => {
            logger.info(`User custom claims modified`);
            responseBody.title = `Your email address has been verified &#127881;`;
            responseBody.caption = `You can now go back to the app and continue using it.`;
        })
        .catch((error) => {
            logger.error(`Email could not be verified for ${emailAddress}. Error is ${error.message}`);
            responseBody.title = `Verification Failed`;
            responseBody.caption = `Error ${error.message}`;
            const htmlContent = generateHtml(
                responseBody.title,
                responseBody.caption,
            );
            response.status(500).send(htmlContent);
        });

    const htmlContent = generateHtml(responseBody.title, responseBody.caption);
    response.status(200).send(htmlContent);
});

module.exports = router;
