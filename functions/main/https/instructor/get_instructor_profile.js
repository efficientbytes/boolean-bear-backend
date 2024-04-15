const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/:instructorId", async (request, response) => {
    logger.log(`http||get-instructor-profile.`);

    const instructorId = request.params.instructorId || null;

    const responseBody = {
        instructorProfile: null,
        message: null,
    };

    if (instructorId == null) {
        logger.error(`log||instructor id cannot be null`);

        responseBody.message = `instructor id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const instructorProfilePath = `/INSTRUCTOR/PROFILE/FILES/${instructorId}`;
    const instructorProfileRef = admin.firestore().doc(instructorProfilePath);
    const instructorProfileSnapshot = await instructorProfileRef.get();

    if (!instructorProfileSnapshot.exists) {
        logger.error(`log||instructor profile does not exists`);

        responseBody.message = `Instructor profile does not exists.`;
        response.status(400).send(responseBody);
        return;
    }

    const instructorProfile = instructorProfileSnapshot.data();
    responseBody.instructorProfile = {
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
