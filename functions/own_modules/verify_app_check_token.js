const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const verifyAppCheckToken = async (req, res, next) => {
    logger.info(`App check verification started`);
    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
        logger.warn(`No app check token supplied`);
        return res.status(414).send("Unauthorized Device");
    }

    try {
        logger.info(`App check token about to be verified`);
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
        const expirationTimeSeconds = appCheckClaims.token.exp;
        logger.info(`App check token expiration time in seconds is ${expirationTimeSeconds}`);
        if (expirationTimeSeconds * 1000 < Date.now()) {
            logger.warn(`App check token expired. Logged at is ${Date.now()} and token expiration time is ${expirationTimeSeconds}`);
            return res.status(415).send("Unauthorized Device");
        }
        logger.info(`App check token verified`);
        return next();
    } catch (error) {
        logger.error(`App check token could not be verified. Error is ${error.toString()}`);
        return res.status(414).send("Unauthorized Device");
    }
}

module.exports = {
    verifyAppCheckToken,
};