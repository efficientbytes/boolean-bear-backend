const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const verifyIdToken = async (req, res, next) => {
    logger.info(`Firebase ID token verification started`);
    const authorization = req.header("authorization");

    if (!authorization) {
        logger.warn(`Firebase ID token not supplied`);
        return res.status(401).send(`Authentication Required`);
    }

    if (!authorization.startsWith("Bearer ")) {
        logger.warn(`Firebase ID token not supplied`);
        return res.status(401).send(`Authentication Required`);
    }

    try {
        const idToken = authorization.split(' ')[1];
        const tokenData = await admin.auth().verifyIdToken(idToken);

        if (tokenData == null) {
            logger.warn(`Firebase ID token data is null`);
            return res.status(401).send("Authentication Failed");
        }

        const userAccountId = tokenData.uid;

        if (userAccountId == null) {
            logger.warn(`Firebase ID token user account id is null`);
            return res.status(401).send("Authentication Failed");
        }
        logger.info(`Firebase ID token is verified. User account id is ${userAccountId}`);
        req.userAccountId = userAccountId;
        return next();
    } catch (error) {
        logger.error(`Firebase ID token could not be verified. Error is ${error.toString()}. Message is ${error.message}`);
        return res.status(401).send("Authentication Failed");
    }

}

module.exports = {
    verifyIdToken,
};