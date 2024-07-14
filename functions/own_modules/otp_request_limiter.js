const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const otpRequestLimiter = async (req, res, next) => {
    logger.info(`OTP request limiter started`);

    const phoneNumber = req.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = req.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        logger.warn(`Phone number is not supplied`);
        responseBody.message = `Phone number is not provided.`;
        return res.status(400).send(responseBody);
    }

    if (prefix == null) {
        logger.warn(`Prefix is not supplied`);
        responseBody.message = `Prefix is not provided.`;
        return res.status(400).send(responseBody);
    }

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
        return next();
    }

    //check if the user is blocked or not
    const logData = verifyLogQuery.data();

    const isBlocked = logData.blocked || false;
    if (isBlocked === true) {
        logger.warn(`Phone number blocked`);
        responseBody.message = `Due to suspicious activity, your requests have been permanently blocked.`;
        return res.status(400).send(responseBody);
    }

    //check if the temp field array is empty or not
    const temporaryLogs = logData.temporaryLog || [];

    if (temporaryLogs.length === 0) {
        logger.info(`User does not have any failed attempts yet`);
        return next();
    }

    logger.info(`User has ${temporaryLogs.length} failed attempts`);
    if (temporaryLogs.length > 0 && temporaryLogs < 3) {
        //check if the current request is within 24 hours of the 1st failed attempt
        const millisecondsIn24Hours = 24 * 60 * 60 * 1000;
        const currentTimeInMillis = new Date();

        const initialFailInMillis = temporaryLogs[0].toDate();
        const timeDiff = currentTimeInMillis - initialFailInMillis;

        if (timeDiff > millisecondsIn24Hours) {
            logger.info(`User has passed the 24 hour waiting time`);
            //clear the temp field
            await verifyLogRef.update({
                temp: [],
            }).then(() => {
                logger.info(`Cleared the temp field`);
            }).catch((error) => {
                logger.error(`Could not clear the temp field. Error is ${error.message}`);
            });
        } else {
            logger.warn(`User is requesting another OTP within 24 hours with ${temporaryLogs.length} failed attempts previously`);
        }
        return next();
    }

    if (temporaryLogs.length === 3) {
        //check if the current attempt time is within 72 hours of the 3rd failed attempt
        const millisecondsIn72Hours = 72 * 60 * 60 * 1000;
        const currentTimeInMillis = new Date();

        const thirdFailInMillis = temporaryLogs[2].toDate();
        const timeDiff = currentTimeInMillis - thirdFailInMillis;

        if (timeDiff < millisecondsIn72Hours) {
            logger.warn(`Phone number suspended temporarily`);
            responseBody.message = `Due to suspicious activity, your requests have been temporarily suspended.`;
            return res.status(400).send(responseBody);
        } else {
            logger.info(`User is requesting another OTP after 72 hours with ${temporaryLogs.length} failed attempts previously`);
        }
        return next();
    }

}

module.exports = {
    otpRequestLimiter,
};