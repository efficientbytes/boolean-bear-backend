const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/:instructorId", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

    const instructorId = request.params.instructorId || null;

    const responseBody = {
        instructorProfile: null,
        message: null,
    };

    if (instructorId == null) {
        responseBody.message = `instructor id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const instructorProfilePath = `/INSTRUCTOR/PROFILE/FILES/${instructorId}`;
    const instructorProfileRef = admin.firestore().doc(instructorProfilePath);
    const instructorProfileSnapshot = await instructorProfileRef.get();

    if (!instructorProfileSnapshot.exists) {
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
