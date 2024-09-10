const admin = require("firebase-admin");
const express = require("express");
const {escape} = require("querystring");
const crypto = require("crypto");
const {logger} = require("firebase-functions");
const router = express.Router();
const securityKey = process.env.CONTENT_API_KEY;
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

function generateSignedUrl(
    videoId,
    minutes = 45,
) {
    logger.info(`Function generateSignedUrl started`);
    logger.info(`Video id is ${videoId}`);
    /*
      url: CDN URL w/o the trailing '/' - exp. http://test.b-cdn.net/file.png
      securityKey: Security token found in your pull zone
      expirationTime: Authentication validity (default. 86400 sec/24 hrs)
      userIp: Optional parameter if you have the User IP feature enabled
      isDirectory: Optional parameter - "true" returns a URL separated by forward slashes (exp. (domain)/bcdn_token=...)
      pathAllowed: Directory to authenticate (exp. /path/to/images)
      countriesAllowed: List of countries allowed (exp. CA, US, TH)
      countriesBlocked: List of countries blocked (exp. CA, US, TH)
    */

    //concatenate videoID with the base url
    const baseUrl = "https://vz-1dcf0c6d-a1b.b-cdn.net/";
    const unsignedUrl = baseUrl + videoId + `/playlist.m3u8`;

    let parameterData = '', parameterDataUrl = '', signaturePath = '', hashAbleBase = '', token = '';

    //set expiration time
    const expirationTime = Math.round(Date.now() / 1000) + (60 * minutes);

    //add countries to the block and allow list to generate new link
    const allowedCountriesList = null;
    const blockedCountriesList = null;

    let temporaryUrl = unsignedUrl;
    if (allowedCountriesList != null) {
        const allowedCountriesUrl = new URL(temporaryUrl);
        temporaryUrl += (allowedCountriesUrl.search === '' ? '?' : '&') + 'token_countries=' + allowedCountriesList;
    }
    if (blockedCountriesList != null) {
        const blockedCountriesUrl = new URL(temporaryUrl);
        temporaryUrl +=
            (blockedCountriesUrl.search === '' ? '?' : '&') + 'token_countries_blocked=' + blockedCountriesList;
    }
    const urlWithCountryBlocker = temporaryUrl;

    //pre encryption formatting
    const parsedUrl = new URL(urlWithCountryBlocker);
    const parameters = new URL(urlWithCountryBlocker).searchParams;

    const allowSubDirectoriesFor = `/${videoId}/`;
    if (allowSubDirectoriesFor !== '') {
        signaturePath = allowSubDirectoriesFor;
        parameters.set('token_path', signaturePath);
    } else {
        signaturePath = decodeURIComponent(parsedUrl.pathname);
    }
    parameters.sort();
    if (Array.from(parameters).length > 0) {
        parameters.forEach(function (value, key) {
            if (value === '') {
                return;
            }
            if (parameterData.length > 0) {
                parameterData += '&';
            }
            parameterData += key + '=' + value;
            parameterDataUrl += '&' + key + '=' + escape(value);
        });
    }

    logger.info(`Token about to be hashed`);
    //generate the token after encryption
    hashAbleBase = securityKey + signaturePath + expirationTime + '' + parameterData;
    token = Buffer.from(crypto.createHash('sha256').update(hashAbleBase).digest(),).toString('base64');
    token = token
        .replace(/\n/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    logger.info(`Token generated`);

    //generate the complete url
    return (
        parsedUrl.protocol +
        '//' +
        parsedUrl.host +
        '/bcdn_token=' +
        token +
        parameterDataUrl +
        '&expires=' +
        expirationTime +
        parsedUrl.pathname
    );
}


router.get("/:videoId/play-link", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API get_reel_play_link started`);
    const videoId = request.params.videoId || null;
    logger.info(`Reel id is ${videoId}`);
    const responseBody = {
        data: null,
        message: null
    }

    if (videoId == null) {
        logger.warn(`Reel id is not supplied`);
        responseBody.message = `Reel id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    logger.info(`Video id is ${videoId}`);

    try {
        logger.info(`Signed play link about to be generated`);
        responseBody.data = generateSignedUrl(videoId, 10);
        responseBody.message = `Successfully fetched play link`;
        response.status(200).send(responseBody);
    } catch (error) {
        logger.error(`Signed play link could not be generated. Error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    }
});

module.exports = router;
