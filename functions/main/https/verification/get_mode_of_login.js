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
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

const sendOtp = async (prefix, phoneNumber, response, responseBody) => {
    logger.info(`Function sendOtp started`);
    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber) {
            responseBody.data.phoneNumberData.prefix = prefix;
            responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
            responseBody.data.mode = 0;
            responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
            response.status(200).send(responseBody);
            return;
        }
    }

    logger.info(`OTP about to be sent to ${prefix}${phoneNumber}`);
    return await twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then((verification) => {

            if (verification.status === "pending") {
                logger.info(`OTP sent to ${prefix}${phoneNumber}`);
                responseBody.data.phoneNumberData.prefix = prefix;
                responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
                responseBody.data.mode = 0;
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                response.status(200).send(responseBody);
            } else {
                logger.warn(`OTP status for ${prefix}${phoneNumber} is ${verification.status}`);
            }

        })
        .catch((error) => {
            logger.error(`OTP could not be sent to ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.data.phoneNumberData.prefix = prefix;
            responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
            responseBody.data.mode = 0;
            responseBody.message = `Verification error identifier ${error.code}`;
            response.status(500).send(responseBody);
        });

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
        await sendOtp(prefix, phoneNumber, response, responseBody);
        return
    }

    const userAccountId = userProfileQueryResult.docs.pop().id;
    const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();


    if (!passwordQueryResult.exists) {
        logger.info(`User password not created. Login mode is OTP based`);
        await sendOtp(prefix, phoneNumber, response, responseBody);
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
