const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  registerController,
  loginController,
  postCourseController,
  getAllCoursesUserController,
  deleteCourseController,
  getAllCoursesController,
  enrolledCourseController,
  sendCourseContentController,
  completeSectionController,
  sendAllCoursesUserController,
} = require("../controllers/userControllers");

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Routes
router.post("/register", registerController);
router.post("/login", loginController);

// Post a new course
router.post("/addcourse", authMiddleware, upload.array("S_content"), postCourseController);

// Get all courses
router.get("/getallcourses", getAllCoursesController);

// Get all courses for a specific user (teacher)
router.get("/getallcoursesteacher", authMiddleware, getAllCoursesUserController);

// Delete a course
router.delete("/deletecourse/:courseid", authMiddleware, deleteCourseController);

// Enroll a student in a course
router.post("/enrolledcourse/:courseid", authMiddleware, enrolledCourseController);

// Get course content
router.get("/coursecontent/:courseid", authMiddleware, sendCourseContentController);

// Complete a section
router.post("/completemodule", authMiddleware, completeSectionController);

// Get all courses of a user
router.get("/getallcoursesuser", authMiddleware, sendAllCoursesUserController);

module.exports = router;
