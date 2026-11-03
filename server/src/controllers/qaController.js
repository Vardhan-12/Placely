// qaController.js - Controllers for Questions and Answers

const mongoose = require("mongoose");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Company = require("../models/Company");

// ─────────────────────────────────────────────
// @route   POST /api/qa/questions
// @desc    Ask a question (juniors and seniors)
// @access  Private — Junior, Senior
// ─────────────────────────────────────────────
const createQuestion = async (req, res, next) => {
  try {
    const { company, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    if (!company || !mongoose.Types.ObjectId.isValid(company)) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const question = await Question.create({
      company,
      askedBy: req.user._id,
      text: text.trim(),
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/qa/questions
// @desc    Get questions by company (public)
// @access  Public
// ─────────────────────────────────────────────
const getQuestions = async (req, res, next) => {
  try {
    const { company } = req.query;

    const filter = {};
    if (company) {
      if (!mongoose.Types.ObjectId.isValid(company)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company ID format",
        });
      }
      filter.company = company;
    }

    const questions = await Question.find(filter)
      .populate("askedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Attach answerCount to each question
    const questionsWithCount = await Promise.all(
      questions.map(async (q) => {
        const answerCount = await Answer.countDocuments({ question: q._id });
        return {
          ...q,
          answerCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: questionsWithCount.length,
      data: questionsWithCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/qa/questions/:id
// @desc    Get single question with its answers (public)
//          Best answer first, then sorted by upvote count
// @access  Public
// ─────────────────────────────────────────────
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format",
      });
    }

    const question = await Question.findById(id)
      .populate("askedBy", "name")
      .populate("company", "name")
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const answers = await Answer.find({ question: id })
      .populate("answeredBy", "name role")
      .lean();

    // Sort: best answer first (isBest === true), then highest upvotes
    answers.sort((a, b) => {
      if (a.isBest && !b.isBest) return -1;
      if (!a.isBest && b.isBest) return 1;
      return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        ...question,
        answers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/qa/questions/:id/answers
// @desc    Answer a question (verified seniors only)
// @access  Private — Verified Senior
// ─────────────────────────────────────────────
const createAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer text is required",
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const answer = await Answer.create({
      question: id,
      answeredBy: req.user._id,
      text: text.trim(),
      upvotes: [],
      isBest: false,
    });

    res.status(201).json({
      success: true,
      data: answer,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/qa/answers/:id/upvote
// @desc    Toggle upvote on an answer
// @access  Private — Authenticated User
// ─────────────────────────────────────────────
const toggleAnswerUpvote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer ID format",
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    const userIdStr = req.user._id.toString();
    const alreadyUpvoted = answer.upvotes.some((uId) => uId.toString() === userIdStr);

    if (alreadyUpvoted) {
      answer.upvotes = answer.upvotes.filter((uId) => uId.toString() !== userIdStr);
    } else {
      answer.upvotes.push(req.user._id);
    }

    await answer.save();

    res.status(200).json({
      success: true,
      upvoteCount: answer.upvotes.length,
      message: alreadyUpvoted ? "Upvote removed" : "Upvote added",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/qa/answers/:id/best
// @desc    Mark an answer as best (only question author)
// @access  Private — Question Asker
// ─────────────────────────────────────────────
const markBestAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer ID format",
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    const question = await Question.findById(answer.question);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Only the user who asked the question can mark an answer as best
    if (question.askedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the person who asked the question can mark an answer as best",
      });
    }

    // Unset any previous best answer for this question
    await Answer.updateMany(
      { question: question._id, isBest: true },
      { isBest: false }
    );

    answer.isBest = true;
    await answer.save();

    res.status(200).json({
      success: true,
      message: "Answer marked as best",
      data: answer,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/qa/questions/:id
// @desc    Delete a question and its answers (owner or admin)
// @access  Private — Owner or Admin
// ─────────────────────────────────────────────
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format",
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const isOwner = question.askedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the author or an admin can delete this question.",
      });
    }

    // Deleting a question also deletes all its answers
    await Answer.deleteMany({ question: question._id });
    await Question.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Question and its answers deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/qa/answers/:id
// @desc    Delete an answer (owner or admin)
// @access  Private — Owner or Admin
// ─────────────────────────────────────────────
const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid answer ID format",
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    const isOwner = answer.answeredBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the author or an admin can delete this answer.",
      });
    }

    await Answer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  createAnswer,
  toggleAnswerUpvote,
  markBestAnswer,
  deleteQuestion,
  deleteAnswer,
};

