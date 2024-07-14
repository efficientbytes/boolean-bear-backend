const admin = require("firebase-admin");

const verifyOneTimeAppCheckToken = async (req, res, next) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
        return res.status(414).send("Unauthorized Device");
    }
    try {
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken, {consume: true});
        if (appCheckClaims === undefined) {
            return res.status(416).send("Unauthorized Device");
        }
        if (appCheckClaims.alreadyConsumed) {
            return res.status(417).send("Unauthorized Device");
        }
        return next();
    } catch (err) {
        return res.status(414).send("Unauthorized Device");
    }
}

module.exports = {
    verifyOneTimeAppCheckToken,
};