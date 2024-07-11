const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/:instructorId", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const instructorId = request.params.instructorId || null;

    const responseBody = {
        data: null,
        message: null,
    };

    if (instructorId == null) {
        responseBody.message = `instructor id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const instructorProfilePath = `/INSTRUCTORS/PRIVATE-PROFILES/FILES/${instructorId}`;
    const instructorProfileRef = admin.firestore().doc(instructorProfilePath);
    const instructorProfileSnapshot = await instructorProfileRef.get();

    if (!instructorProfileSnapshot.exists) {
        responseBody.message = `Instructor profile does not exists.`;
        response.status(400).send(responseBody);
        return;
    }

    const instructorProfile = instructorProfileSnapshot.data();
    responseBody.data = {
        instructorId: instructorProfile.instructorId,
        firstName: instructorProfile.firstName,
        lastName: instructorProfile.lastName,
        bio: instructorProfile.bio,
        oneLineDescription: instructorProfile.oneLineDescription,
        profession: instructorProfile.profession,
        workingAt: instructorProfile.workingAt,
        profileImage: instructorProfile.profileImage,
        coverImage: instructorProfile.coverImage,
        gitHubUsername: instructorProfile.gitHubUsername,
        linkedInUsername: instructorProfile.linkedInUsername,
        skills: instructorProfile.skills
    };
    responseBody.message = `Instructor profile successfully fetched.`
    response.status(200).send(responseBody);

});

module.exports = router;
