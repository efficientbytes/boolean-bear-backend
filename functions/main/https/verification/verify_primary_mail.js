const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

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
    const emailAddress = request.query.emailAddress || null;
    const userAccountId = request.query.id || null;
    const verificationKey = request.query.publicKey || null;

    const responseBody = {
        title: null,
        caption: null,
    };

    if (verificationKey == null) {
        responseBody.title = `Verification Failed`;
        responseBody.caption = `Verification key is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (userAccountId == null) {
        responseBody.title = `Verification Failed`;
        responseBody.caption = `User account id is not provided.`;
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(400).send(htmlContent);
        return;
    }

    if (emailAddress == null) {
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
            return true;
        })
        .catch((error) => {
            responseBody.title = `Verification Failed`;
            responseBody.caption = `User id is not authenticated.`;
            return false;
        });

    if (userIdCheck !== true) {
        const htmlContent = generateHtml(responseBody.title, responseBody.caption);
        response.status(401).send(htmlContent);
        return;
    }

    const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/${userAccountId}`;
    const userProfilePathRef = admin.firestore().doc(userProfilePath);
    const userProfilePathSnapshot = await userProfilePathRef.get();

    if (!userProfilePathSnapshot.exists) {
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
            return true;
        })
        .catch((error) => {
            logger.error(`verify-primary-mail||failed||http||error is ${error.message}`);
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
            responseBody.title = `Your email address has been verified &#127881;`;
            responseBody.caption = `You can now go back to the app and continue using it.`;
        })
        .catch((error) => {
            logger.error(`verify-primary-mail||failed||http||error is ${error.message}`);
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
