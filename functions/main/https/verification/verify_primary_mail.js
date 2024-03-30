const express = require("express");
const router = express.Router();
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

function generateHtml(title, caption) {
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
    logger.log(`http||verify-primary-mail`);

    const emailAddress = request.query.emailAddress || null;
    logger.log(`param||email address is : ${emailAddress}`);
    const userAccountId = request.query.id || null;
    logger.log(`param||user account id is : ${userAccountId}`);
    const verificationKey = request.query.publicKey || null;
    logger.log(`param||first name is : ${verificationKey}`);

    const responseBody = {
        title: null,
        caption: null,
    };

    if (verificationKey == null) {
        logger.error(`log||verification key is null.`);

        responseBody.title = `Verification Failed`;
        responseBody.caption = `Verification key is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (userAccountId == null) {
        logger.error(`log||user account id is null.`);

        responseBody.title = `Verification Failed`;
        responseBody.caption = `User account id is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (emailAddress == null) {
        logger.error(`log||email address is null.`);

        responseBody.title = `Verification Failed`;
        responseBody.caption = `Email address is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    //check if the user id is authenticated
    const userIdCheck = await admin
        .auth()
        .getUser(userAccountId)
        .then((result) => {
            logger.log(`log||User authenticated, user account id ${result.uid}`);
            return true;
        })
        .catch((error) => {
            logger.error(
                `log||user id is not authenticated. Error is ${error.message}`,
            );
            responseBody.title = `Verification Failed`;
            responseBody.caption = `User id is not authenticated.`;
            return false;
        });

    if (userIdCheck !== true) {
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(401).send(htmlContent);
        return;
    }

    const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
    const userProfilePathRef = admin.firestore().doc(userProfilePath);
    const userProfilePathSnapshot = await userProfilePathRef.get();

    if (!userProfilePathSnapshot.exists) {
        //user profile does not exists
        logger.error(
            `log||User record for user with user account id ${userAccountId} does not exists.`,
        );
        responseBody.title = `Verification Failed`;
        responseBody.caption = `User record doest not exists.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    //check if the emailId in the mail is same as the email id in the verification document

    const verificationId = verificationKey.substring(3);
    const primaryMailVerificationKeyPath = `/VERIFICATION/PRIMARY_MAIL/FILES/${verificationId}`;
    const primaryMailVerificationRef = admin
        .firestore()
        .doc(primaryMailVerificationKeyPath);
    const primaryMailVerificationSnapshot =
        await primaryMailVerificationRef.get();

    if (!primaryMailVerificationSnapshot.exists) {
        //verification record does not exist
        logger.error(
            `log||Primary verification credentials with key ${verificationId} for user with user account id ${userAccountId} does not exists.`,
        );
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
        logger.error(
            `log||Verification credentials for user with user account id ${userAccountId} does not match.`,
        );
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
            logger.log(
                `log||Email address has been updated to ${emailAddress} for user with user account id ${userAccountId}`,
            );
            return true;
        })
        .catch((error) => {
            logger.error(
                `log||could not update new email address ${emailAddress} for user with user account id ${userAccountId}`,
            );
            responseBody.title = `Verification Failed`;
            responseBody.caption = `${error.message}`;
            return false;
        });

    if (updateResult !== true) {
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(500).send(htmlContent);
        return;
    }

    const customClaim = {
        emailVerified: true,
    };

    await admin
        .auth()
        .setCustomUserClaims(userAccountId, customClaim)
        .then(async () => {
            logger.log(
                `log||email address ${emailAddress} for user with user account id ${userAccountId} has been verified.`,
            );
            responseBody.title = `Your email address has been verified &#127881;`;
            responseBody.caption = `You can now go back to the app and continue using it.`;
        })
        .catch((error) => {
            logger.error(
                `log||custom claim email verification field for email address ${emailAddress} for user with user account id ${userAccountId} could not be set to true.`,
            );
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
