const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

class User {
    constructor(username, phoneNumber, otp, prefix = "+91") {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
        this.prefix = prefix;
    }
}

const sendOTP = async (prefix, phoneNumber, response, responseBody) => {

    const anubhav = new User("Anubhav", "", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber && user.prefix === prefix) {
            responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
            responseBody.data.prefix = prefix;
            responseBody.data.phoneNumber = phoneNumber;
            response.status(200).send(responseBody);
            return;
        }
    }

    const completePhoneNumber = prefix + phoneNumber;
    const verifyLogPath = `/USERS/VERIFICATIONS/OTP-REQUESTS/${completePhoneNumber}`;
    const verifyLogRef = admin.firestore().doc(verifyLogPath);

    await twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then(async (verification) => {

            if (verification.status === "pending") {

                await verifyLogRef.update({
                    otpRequests: admin.firestore.FieldValue.arrayUnion(Date.now()),
                });

                logger.info(`OTP sent to ${prefix}${phoneNumber}`);
                responseBody.data.phoneNumberData.prefix = prefix;
                responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
                responseBody.data.mode = 0;
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                return response.status(200).send(responseBody);
            } else {
                logger.warn(`OTP status for ${prefix}${phoneNumber} is ${verification.status}`);
                responseBody.message = `OTP could not be sent. Status is ${verification.status}`;
                return response.status(400).send(responseBody);
            }

        })
        .catch((error) => {
            logger.error(`OTP could not be sent to ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.data.phoneNumberData.prefix = prefix;
            responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
            responseBody.data.mode = 0;
            responseBody.message = `Verification error identifier ${error.code}`;
            return response.status(500).send(responseBody);
        });

}

const otpLimiter = async (prefix, phoneNumber, response, responseBody) => {
    logger.info(`Function otpLimiter started`);

    //check if the user has associated log or not
    const completePhoneNumber = prefix + phoneNumber;
    const verifyLogPath = `/USERS/VERIFICATIONS/OTP-REQUESTS/${completePhoneNumber}`;
    const verifyLogRef = admin.firestore().doc(verifyLogPath);
    const verifyLogQuery = await verifyLogRef.get();

    if (!verifyLogQuery.exists) {
        logger.info(`User requesting OTP for first time`);
        // user requesting otp for first time
        // create a log document here
        await verifyLogRef.create({
            otpRequests: [],
            verificationRequests: [],
            approved: [],
            failed: [],
            temporaryLogs: [],
            blocked: false,
            blockedOn: null,
            failedIpAddresses: [],
            prefix: prefix,
            phoneNumber: phoneNumber,
            completePhoneNumber: completePhoneNumber,
        }).then(() => {
            logger.info(`OTP request log document created`);
        }).catch((error) => {
            logger.error(`OTP request log document could not be created. Error is ${error.message}`);
        });
        await sendOTP(prefix, phoneNumber, response, responseBody);
        return;
    }

    //check if the user is blocked or not
    const logData = verifyLogQuery.data();

    const isBlocked = logData.blocked || false;
    if (isBlocked === true) {
        logger.warn(`Phone number blocked`);
        responseBody.message = `Due to suspicious activity, your requests have been permanently blocked.`;
        return response.status(400).send(responseBody);
    }

    //check if the temp field array is empty or not
    const temporaryLogs = logData.temporaryLogs || [];

    if (temporaryLogs.length === 0) {
        logger.info(`User does not have any failed attempts yet`);
        await sendOTP(prefix, phoneNumber, response, responseBody);
        return;
    }

    logger.info(`User has ${temporaryLogs.length} failed attempts`);
    if (temporaryLogs.length > 0 && temporaryLogs.length < 3) {
        //check if the current request is within 24 hours of the 1st failed attempt
        const millisecondsIn24Hours = 24 * 60 * 60 * 1000;
        const currentTimeInMillis = Date.now();

        const initialFailInMillis = temporaryLogs[0];
        const timeDiff = currentTimeInMillis - initialFailInMillis;

        if (timeDiff > millisecondsIn24Hours) {
            logger.info(`User has passed the 24 hour waiting time`);
            //clear the temp field
            await verifyLogRef.update({
                temporaryLogs: [],
            }).then(() => {
                logger.info(`Cleared the temp field`);
            }).catch((error) => {
                logger.error(`Could not clear the temp field. Error is ${error.message}`);
            });
        } else {
            logger.warn(`User is requesting another OTP within 24 hours with ${temporaryLogs.length} failed attempts previously`);
        }
        await sendOTP(prefix, phoneNumber, response, responseBody);
        return;
    }

    if (temporaryLogs.length === 3) {
        //check if the current attempt time is within 72 hours of the 3rd failed attempt
        const millisecondsIn72Hours = 72 * 60 * 60 * 1000;
        const currentTimeInMillis = Date.now();

        const thirdFailInMillis = temporaryLogs[2];
        const timeDiff = currentTimeInMillis - thirdFailInMillis;

        if (timeDiff < millisecondsIn72Hours) {
            logger.warn(`Phone number suspended temporarily`);
            responseBody.message = `Due to suspicious activity, your requests have been temporarily suspended.`;
            return response.status(400).send(responseBody);
        } else {
            logger.info(`User is requesting another OTP after 72 hours with ${temporaryLogs.length} failed attempts previously`);
            await sendOTP(prefix, phoneNumber, response, responseBody);
            return;
        }
    }

    logger.info(`User has crossed 3 previous failed OTP attempts`);
    if (temporaryLogs.length > 3 && temporaryLogs.length <= 5) {
        logger.info(`OTP about to be sent to ${prefix}${phoneNumber}`);
        await sendOTP(prefix, phoneNumber, response, responseBody);
        return;
    } else {
        logger.warn(`Phone number blocked`);
        responseBody.message = `Due to suspicious activity, your requests have been permanently blocked.`;
        return response.status(400).send(responseBody);
    }
}

router.post("/", verifyAppCheckToken, async (request, response) => {
    logger.info(`API get_mode_of_login started`);
    const phoneNumber = request.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = request.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);

    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        phoneNumberData: null,
        userAccountId: null,
        mode: -1,
    }

    responseBody.data.phoneNumberData = {
        phoneNumber: null,
        prefix: null,
    }

    if (phoneNumber == null) {
        logger.warn(`Phone number not supplied`);
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        logger.warn(`Prefix not supplied`);
        responseBody.message = `Prefix is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/`;
    const userProfileQueryResult = await admin
        .firestore()
        .collection(userProfilePath)
        .where("phoneNumber", "==", phoneNumber)
        .where("phoneNumberPrefix", "==", prefix)
        .limit(1)
        .get();

    if (userProfileQueryResult.empty) {
        logger.info(`User profile document does not exists. New User. Login mode is OTP based`);
        await otpLimiter(prefix, phoneNumber, response, responseBody);
        return
    }

    const userAccountId = userProfileQueryResult.docs.pop().id;
    const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();


    if (!passwordQueryResult.exists) {
        logger.info(`User password not created. Login mode is OTP based`);
        await otpLimiter(prefix, phoneNumber, response, responseBody);
        return
    }

    logger.info(`User password document exists. Login mode is password based`);
    //password mode
    //send userAccountId
    responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
    responseBody.data.phoneNumberData.prefix = prefix;
    responseBody.data.userAccountId = userAccountId;
    responseBody.data.mode = 1;
    responseBody.message = ``;
    response.status(200).send(responseBody);

});

module.exports = router;
