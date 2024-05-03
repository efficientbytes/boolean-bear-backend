const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

class Courses {
    constructor(title, description, displayIndex = 1, language = "EN", certification = true, type1Thumbnail = null, type2Thumbnail = null, courseId = null, isPaid = true, validity = 12, hashTags = ["coding"], instructorId = "ab0421c2-c01b-4bf4-8fd9-18ea84e0bf58", timeInHours = 14, timeInDays = 7, createdOn = null, updatedOn = null) {
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.displayIndex = displayIndex;
        this.language = language;
        this.certification = certification;
        this.type1Thumbnail = type1Thumbnail;
        this.type2Thumbnail = type2Thumbnail;
        this.hashTags = hashTags;
        this.instructorId = instructorId;
        this.timeInHours = timeInHours;
        this.timeInDays = timeInDays;
        this.isPaid = isPaid;
        this.validity = validity;
        this.createdOn = createdOn;
        this.updatedOn = updatedOn;
    }
}

router.post("/", async (request, response) => {


    const topicId = request.body.topicId || null;

    const responseBody = {
        message: null,
    };

    if (topicId == null) {
        responseBody.message = "Topic id is not provided"
        response.status(400).send(responseBody);
        return;
    }

    const kotlinCourses = [
        new Courses("Kotlin for beginners", "Whether you're a seasoned developer or just starting out, this playlist is your gateway to mastering Kotlin. Explore the fundamentals of Kotlin programming through easy-to-follow tutorials, hands-on examples, and practical exercises."),
        new Courses("Object Oriented Programming in Kotlin", "Build a solid foundation in object-oriented programming (OOP) with Kotlin. This playlist covers essential OOP concepts, including classes, objects, inheritance, and polymorphism, in the context of Kotlin programming. Whether you're new to programming or transitioning from another language, master the fundamentals of OOP with Kotlin's concise syntax and intuitive language constructs."),
        new Courses("Kotlin Advanced", "Elevate your Kotlin skills to the next level with this advanced playlist. Explore Kotlin's powerful features and language constructs that go beyond the basics. From coroutines and DSLs to metaprogramming and reflection, this playlist delves into advanced topics to help you become a proficient Kotlin developer."),
    ];

    const javaCourses = [
        new Courses("Java for beginners", "Discover the power of Java programming with this introductory playlist designed for beginners. Whether you're new to coding or looking to expand your skills, this playlist provides a gentle yet comprehensive introduction to Java, covering everything you need to know to get started."),
        new Courses("Object Oriented Programming in Java", "Build a solid foundation in object-oriented programming (OOP) with Java. This playlist covers the fundamental principles and concepts of OOP, including classes, objects, inheritance, polymorphism, and encapsulation. Whether you're new to programming or transitioning from another language, join us as we demystify OOP in Java and empower you to design elegant and maintainable software solutions."),
        new Courses("Concurrency in Java", "Ready to take your Java programming skills to the next level? This playlist offers a deep dive into concurrency essentials in Java, providing a solid foundation for designing and implementing concurrent systems. Explore key concepts such as thread management, thread safety, and inter-thread communication as you learn to leverage Java's concurrency APIs effectively."),
    ];

    const cPlusPlusCourses = [
        new Courses("C++ for beginners", "Welcome to the exciting world of C++ programming! Designed for beginners, this playlist provides a gentle introduction to C++ programming, covering essential concepts, syntax, and best practices. Get ready to unleash your coding potential and embark on a journey of discovery with C++."),
        new Courses("Object Oriented Programming in C++", "Ready to take your C++ skills to the next level? This playlist offers a deep dive into object-oriented programming (OOP) concepts in C++, providing a solid foundation for building complex and maintainable software systems. From designing classes to implementing inheritance and polymorphism, join us as we explore the principles and practices of OOP in C++."),
    ];

    const figmaCourses = [
        new Courses("Figma for beginners", "Ready to bring your designs to life? This playlist is your guide to prototyping with Figma, the industry-leading design tool for interactive prototypes. Learn how to create clickable prototypes, define interactions, and simulate user flows with Figma's powerful prototyping features. Whether you're designing web apps, mobile interfaces, or digital experiences, join us as we explore the art of prototyping with Figma."),
    ];

    const androidXMLCourses = [
        new Courses("Android for beginners", "Unlock the power of Android app development with this hands-on playlist. Follow along as we walk you through the process of building your first Android app from scratch. Learn how to create user interfaces, handle user interactions, and integrate functionality using Java or Kotlin, empowering you to bring your app ideas to life."),
    ];

    const androidComposeCourses = [
        new Courses("Android Compose for beginners", "Build a strong foundation in Jetpack Compose basics with this beginner-friendly playlist. Whether you're new to Android development or experienced with traditional UI frameworks, learn how to use Compose's intuitive APIs to create dynamic and responsive UIs for Android apps. Join us as we explore the fundamental tools and techniques of Compose and help you unleash your creativity in UI design."),
    ];

    const gitCourses = [
        new Courses("Git for beginners", "Empower your team to collaborate more effectively with Git. This playlist covers the collaborative features of Git, including remote repositories, pull requests, code reviews, and more. Whether you're working with a distributed team or contributing to open-source projects, learn how Git can streamline your development workflow and foster better collaboration across your team."),
    ];

    const coursePath = `/ASSETS/CONTENTS/TOPICS/${topicId}/COURSES/`;
    const courseRef = admin.firestore().collection(coursePath);
    const time = admin.firestore.FieldValue.serverTimestamp();

    try {
        let courses
        if (topicId === "1fBADxBeBlBfeOXmj9KU") {
            courses = kotlinCourses;
        } else if (topicId === "gcHWk3dglkbeXxMSpyuN") {
            courses = javaCourses;
        } else if (topicId === "getMJ6rW7fU9wanGnOLW") {
            courses = cPlusPlusCourses;
        } else if (topicId === "pIr3fyFJmhtGSdyPMGrb") {
            courses = figmaCourses;
        } else if (topicId === "skArTTVsQt8IpygIoGyb") {
            courses = androidXMLCourses;
        } else if (topicId === "gqvDHr85Wn1AoRQ73RGh") {
            courses = androidComposeCourses;
        } else if (topicId === "p0NTZAF90knvWHzOBpqh") {
            courses = gitCourses;
        } else {
            courses = null;
        }

        if (courses == null) {
            responseBody.message = "Course list could not be allocated";
            response.status(500).send(responseBody);
            return;
        }
        for (const course of courses) {
            course.courseId = courseRef.doc().id;
            await courseRef.doc(course.courseId).set({
                courseId: course.courseId,
                title: course.title,
                description: course.description,
                displayIndex: course.displayIndex,
                language: course.language,
                certification: course.certification,
                type1Thumbnail: course.type1Thumbnail,
                type2Thumbnail: course.type2Thumbnail,
                hashTags: course.hashTags,
                instructorId: course.instructorId,
                timeInHours: course.timeInHours,
                timeInDays: course.timeInDays,
                isPaid: course.isPaid,
                validity: course.validity,
                createdOn: time,
                updatedOn: time
            });
        }
        responseBody.message = `Courses have been successfully uploaded.`;
        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = `Could not upload the courses, Error is ${error.message}`;
        response.status(500).send(responseBody);
    }
});

module.exports = router;
