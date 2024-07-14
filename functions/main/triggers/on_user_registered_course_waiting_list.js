const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

exports.onUserJoinedCourseWaitingList = onDocumentCreated("/ASSETS/CURATED/COURSES/{courseId}/WAITING-LIST/{docId}",
    async (event) => {
        logger.info(`Trigger onCreate onUserJoinedCourseWaitingList started`);
        const courseId = event.params.courseId;
        const waitingListData = event.data.data();
        const userAccountId = waitingListData.userAccountId;
        logger.info(`User account id is ${userAccountId}`);

        const userPrivateProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
        const userPrivateProfileRef = admin.firestore().doc(userPrivateProfilePath);
        const userPrivateProfileQueryResult = await userPrivateProfileRef.get();

        if (!userPrivateProfileQueryResult.exists) {
            logger.warn(`User profile document does not exists`);
            return;
        }

        await userPrivateProfileRef.update({
            "courseWaitingList": admin.firestore.FieldValue.arrayUnion(courseId),
        }).then((result) => {
            logger.info(`Course added to waiting list`);
        }).catch((error) => {
            logger.error(`Could not add the course id ${courseId} to user's waiting list`);
        });

    },
);
