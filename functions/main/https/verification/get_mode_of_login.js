const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);

class User {
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

const sendOtp = async (prefix, phoneNumber, response, responseBody) => {

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

    twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then((verification) => {

            if (verification.status === "pending") {
                responseBody.data.phoneNumberData.prefix = prefix;
                responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
                responseBody.data.mode = 0;
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                response.status(200).send(responseBody);
            }

        })
        .catch((error) => {
            logger.error(`get-mode-of-login||failed||http||error is ${error.message}`);
            responseBody.data.phoneNumberData.prefix = prefix;
            responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
            responseBody.data.mode = 0;
            responseBody.message = `Verification error identifier ${error.code}`;
            response.status(503).send(responseBody);
        });

}

router.post("/", async (request, response) => {

    const phoneNumber = request.body.phoneNumber || null;
    const prefix = request.body.prefix || null;

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
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        responseBody.message = `Prefix is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/`;
    const userProfileQueryResult = await admin
        .firestore()
        .collection(userProfilePath)
        .where("phoneNumber", "==", phoneNumber)
        .where("phoneNumberPrefix", "==", prefix)
        .limit(1)
        .get();

    if (userProfileQueryResult.empty) {
        await sendOtp(prefix, phoneNumber, response, responseBody);
        return
    }

    const userAccountId = userProfileQueryResult.docs.pop().id;
    const passwordPath = `/USER/PASSWORDS/FILES/${userAccountId}`;
    const passwordRef = admin.firestore().doc(passwordPath);
    const passwordQueryResult = await passwordRef.get();


    if (!passwordQueryResult.exists) {
        await sendOtp(prefix, phoneNumber, response, responseBody);
        return
    }

    //password mode
    //send userAccountId
    responseBody.data.phoneNumberData.phoneNumber = phoneNumber;
    responseBody.data.phoneNumberData.prefix = prefix;
    responseBody.data.userAccountId = userAccountId;
    responseBody.data.mode = 1;
    responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
    response.status(200).send(responseBody);

});

module.exports = router;
