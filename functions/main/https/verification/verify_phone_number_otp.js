const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const admin = require("firebase-admin");

class User {
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

router.post("/", verifyAppCheckToken, async (request, response) => {
    logger.info(`API verify_phone_number_otp started`);
    const phoneNumber = request.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = request.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);
    const otp = request.body.otp || null;
    logger.info(`OTP is ${otp}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        logger.warn(`Phone number not provided`);
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        logger.warn(`Prefix not provided`);
        response.status(400).send(responseBody);
        return;
    }

    if (otp == null) {
        logger.warn(`OTP not provided`);
        response.status(400).send(responseBody);
        return;
    }

    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber && user.otp === otp) {
            responseBody.message = `Verification successful`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(200).send(responseBody);
            return;
        } else if (user.phoneNumber === phoneNumber && user.otp !== otp) {
            responseBody.message = `Verification failed`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(400).send(responseBody);
            return;
        }
    }

    let ipAddress = request.ip;

    // If behind a proxy, trust the X-Forwarded-For header
    if (request.headers['x-forwarded-for']) {
        ipAddress = request.headers['x-forwarded-for'].split(',')[0];
    }

    const completePhoneNumber = prefix + phoneNumber;
    const verifyLogPath = `/USERS/VERIFICATIONS/OTP-REQUESTS/${completePhoneNumber}`;
    const verifyLogRef = admin.firestore().doc(verifyLogPath);

    const requestedAt = admin.firestore.FieldValue.serverTimestamp();
    await verifyLogRef.update({
        verificationRequests: admin.firestore.FieldValue.arrayUnion(requestedAt),
    });

    logger.info(`Verifying otp ${otp} requested by ${prefix}${phoneNumber}`);
    await twilio.verify.v2
        .services(twilioServiceSid)
        .verificationChecks.create({to: `${prefix}${phoneNumber}`, code: otp})
        .then(async (verification_check) => {
            if (verification_check.status === "approved") {
                logger.info(`OTP verified for ${prefix}${phoneNumber}`);
                await verifyLogRef.update({
                    approved: admin.firestore.FieldValue.arrayUnion(requestedAt),
                    temporaryLogs: [],
                }).then(() => {
                    logger.info(`Logged approved attempt and cleared temporary logs`);
                }).catch((error) => {
                    logger.error(`OTP approved attempt could not be logged and temporary logs could not be cleared. Error is ${error.message}`);
                });
                responseBody.message = `Verification successful`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(200).send(responseBody);
            } else if (verification_check.status === "pending") {
                logger.warn(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}`);
                await verifyLogRef.update({
                    failed: admin.firestore.FieldValue.arrayUnion(requestedAt),
                    temporaryLogs: admin.firestore.FieldValue.arrayUnion(requestedAt),
                    failedIpAddresses: admin.firestore.FieldValue.arrayUnion(ipAddress),
                }).then(() => {
                    logger.info(`Event logged in temporary and failed logs`);
                }).catch((error) => {
                    logger.error(`OTP failed attempt and temporary log could not be logged. Error is ${error.message}`);
                });

                //check if the temp log size is == 3
                const verifyLogQuery = await verifyLogRef.get();
                const logData = verifyLogQuery.data();
                const temporaryLogs = logData.temporaryLog || [];

                if (temporaryLogs.length === 3) {
                    logger.warn(`User has reached 3 failed OTP verification`);
                    logger.warn(`Phone number suspended`);
                    responseBody.message = `Due to suspicious activity, your requests have been temporarily suspended. Try again after 72 hours.`;
                    responseBody.data.phoneNumber = phoneNumber;
                    responseBody.data.prefix = prefix;
                    return response.status(400).send(responseBody);
                }

                if (temporaryLogs.length === 5) {
                    logger.warn(`User has reached 5 failed OTP verification after 72 hour of account suspension`);

                    //block the number
                    await verifyLogRef.update({
                        blocked: true,
                        blockedOn: requestedAt,
                    }).then(() => {
                        logger.info(`Phone number blocked`);
                    }).catch((error) => {
                        logger.error(`Phone number could not be blocked. Error is ${error.message}`);
                    });

                    responseBody.message = `Due to suspicious activity, your requests have been permanently blocked.`;
                    responseBody.data.phoneNumber = phoneNumber;
                    responseBody.data.prefix = prefix;
                    return response.status(400).send(responseBody);
                }

                responseBody.message = `Verification failed`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(400).send(responseBody);
            }
            logger.warn(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}. Status is ${verification_check.status}`);
        })
        .catch((error) => {
            logger.error(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.message = `OTP verification failed. Error code ${error.code}`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(503).send(responseBody);
        });
});

module.exports = router;
