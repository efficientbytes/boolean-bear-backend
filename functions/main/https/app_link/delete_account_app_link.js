const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

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
    const htmlContent = generateHtml("User Account Deletion", "User needs to be logged in the app. Tap on settings > Get in touch with us > Delete your account (Under Feedback & support)");
    return response.status(200).send(htmlContent);
});

module.exports = router;
