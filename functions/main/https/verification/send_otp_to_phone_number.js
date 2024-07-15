const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {otpRequestLimiter} = require("own_modules/otp_request_limiter.js");
const admin = require("firebase-admin");

class User {
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

router.post("/", verifyAppCheckToken, otpRequestLimiter, async (request, response) => {
    logger.info(`API send_otp_to_phone_number started`);
    const phoneNumber = request.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = request.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    /* for (let user of testUserList) {
         if (user.phoneNumber === phoneNumber) {
             responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
             responseBody.data.prefix = prefix;
             responseBody.data.phoneNumber = phoneNumber;
             response.status(200).send(responseBody);
             return;
         }
     }*/

    const completePhoneNumber = prefix + phoneNumber;
    const verifyLogPath = `/USERS/VERIFICATIONS/OTP-REQUESTS/${completePhoneNumber}`;
    const verifyLogRef = admin.firestore().doc(verifyLogPath);

    logger.info(`OTP about to be sent to ${prefix}${phoneNumber}`);
    await twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then(async (verification) => {
            if (verification.status === "pending") {
                //update the otp log otp request field
                await verifyLogRef.update({
                    otpRequests: admin.firestore.FieldValue.arrayUnion(Date.now()),
                });

                logger.info(`OTP sent to ${prefix}${phoneNumber}`);
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                responseBody.data.prefix = prefix;
                responseBody.data.phoneNumber = phoneNumber;
                response.status(200).send(responseBody);
            } else {
                logger.warn(`OTP status for ${prefix}${phoneNumber} is ${verification.status}`);
                responseBody.message = `OTP could not be sent. Status is ${verification.status}`;
                return response.status(400).send(responseBody);
            }
        })
        .catch((error) => {
            logger.error(`OTP could not be sent to ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.message = `OTP request failed. Error code ${error.code}`;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
