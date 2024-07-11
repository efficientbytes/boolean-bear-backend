const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const verifyAppCheckToken = async (req, res, next) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
        logger.info(`App check unauthorized access. No token provided.`);
        return res.status(414).send("Unauthorized Device");
    }

    try {
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
        const expirationTimeSeconds = appCheckClaims.token.exp;
        if (expirationTimeSeconds * 1000 < Date.now()) {
            logger.info(`App check unauthorized access. Token expired.`);
            return res.status(415).send("Unauthorized Device");
        }
        return next();
    } catch (err) {
        logger.info(`App check unauthorized access. Error is ${err.toString()}`);
        return res.status(414).send("Unauthorized Device");
    }
}

module.exports = {
    verifyAppCheckToken,
};