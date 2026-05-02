import fs from "fs";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.services.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" });
        }

        // PDF validation
        if (!req.file.mimetype.includes("pdf")) {
            return res.status(400).json({ message: "Only valid PDF files are allowed" });
        }

        const filepath = req.file.path;
        const resolvedPath = path.resolve(filepath);
        const allowedDir = path.resolve("public");

        if (!resolvedPath.startsWith(allowedDir)) {
            return res.status(400).json({ message: "Invalid file path" });
        }

        const fileBuffer = await fs.promises.readFile(filepath);
        const uint8Array = new Uint8Array(fileBuffer);

        const pdf= await pdfjsLib.getDocument({ data: uint8Array }).
        promise;

        let resumeText = "";


        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

const pageText = content.items
    .map(item => item.str || "")
    .join(" ");       
         resumeText += pageText + "\n";
        }

        resumeText = resumeText
            .replace(/\s+/g, " ")
            .trim();
        const messages = [
            {
                role: "system",
                content: `
Extract structured data from the resume.

If the candidate has no professional work experience, set:
"experience": "Fresher"

Return strictly in JSON:

{
  "role": "string",
  "experience": "Fresher or string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`

            },
            {
                role: "user",
                content: resumeText
            }
        ];

      const aiResponse = await askAi(messages);
      console.log("AI Response:", aiResponse);


let parsed;
try {
const cleanedResponse = aiResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

parsed = JSON.parse(cleanedResponse);} catch (err) {
    console.error("AI JSON Parse Error:", aiResponse);
    return res.status(500).json({
        message: "AI returned invalid JSON format."
    });
}

fs.unlinkSync(filepath);

res.json({
    role: parsed.role || "Unknown Role",
    experience: parsed.experience || "Fresher",
    projects: parsed.projects || [],
    skills: parsed.skills || [],
    resumeText
});

}
catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
        message: error.message
    });
}
    
};

export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience and Mode are required."
      });
    }

    const user = await User.findById(req.userId)

    if(!user){
        return res.status(404).json({
            message: " User not found."
        });
    }
    if(user.credits < 50){
        return res.status(400).json({
            message: "Not enough credits. Minimum 50 required."
        })
    }

const projectText = Array.isArray(projects) && projects.length
        ? projects.join(", ")
        : "None";

    const skillsText = Array.isArray(skills) && skills.length
        ? skills.join(", ")
        : "None";

    const safeResume = resumeText?.trim() || "None";
    const numericExperience = parseInt(experience) || 0;
    const candidateLevel = numericExperience <= 1 ? "Fresher" : "Experienced";

   const userPrompt = `
Role: ${role}
Experience: ${experience}
CandidateLevel: ${candidateLevel}
InterviewMode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`;

if (!userPrompt.trim()) {
    return res.status(400).json({
        message: "Prompt content is empty."
    });
}

const messages = [
  {
    role: "system",
    content: `
Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Experience-based Rules:

For Freshers (0-1 years):
- Focus on fundamentals, academic knowledge, internships, projects, problem-solving, and basic role understanding.
- Questions should test learning ability, communication, and practical project experience.
- Avoid expecting professional industry experience.

For Experienced Candidates (1+ years):
- Focus on real work experience, advanced technical skills, leadership, project ownership, challenges, optimization, and decision-making.
- Questions should reflect professional responsibilities.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard

Make questions based on:
- role
- experience
- interviewMode
- projects
- skills
- resume details

Adapt intelligently depending on whether the candidate is fresher or experienced.
`
  },
  {
    role: "user",
    content: userPrompt
  }
];

const aiResponse = await askAi(messages);

if (!aiResponse || !aiResponse.trim()) {    
    return res.status(500).json({
        message: "AI returned empty response."
    });

}

const questionsArray = aiResponse
    .split("\n")
    .map(q => q.trim())
    .filter(q => q.length > 0)
    .slice(0, 5);

if (questionsArray.length === 0) {
    return res.status(500).json({
        message: "AI failed to generate questions."
    });
}

  
user.credits -= 50;
await user.save();

const interview = await Interview.create({
    userId: user._id,
    role,
    experience,
    mode,
    resumeText: safeResume,
    questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
    }))
});


res.json({
    interviewId: interview._id,
    creditsLeft: user.credits,
    userName: user.name,
    questions: interview.questions
});



 } catch (error) 
 {
    return res.status(500).json({message: `failed to create interview ${error}`});
 }





 }


 export const submitAnswer = async (req, res) => {
  try {
     const { interviewId, questionIndex, answer, timeTaken } = req.body;

        const interview = await Interview.findById(interviewId);
        const question = interview.questions[questionIndex];

        // If no answer
        if (!answer) {
            question.score = 0;
            question.feedback = "You did not submit an answer.";
            question.answer = "";

            await interview.save();

            return res.json({
                feedback: question.feedback
            });
        }

        // If time exceeded
        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;

            await interview.save();

            return res.json({
                feedback: question.feedback
            });
        }
        const numericExperience = parseInt(interview.experience) || 0;
      const candidateLevel =
    numericExperience <= 1 ? "Fresher" : "Experienced";

       const messages = [
  {
    role: "system",
    content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Candidate Type:
- Fresher (0-1 years): Evaluate based on fundamentals, learning ability, communication, confidence, academic understanding, project clarity, and problem-solving.
- Experienced (1+ years): Evaluate based on professional expertise, practical implementation, leadership, technical depth, decision-making, and communication.

Evaluation Rules:
- Judge according to candidate experience level.
- Freshers should NOT be penalized for lack of corporate exposure.
- Experienced candidates should be held to higher professional standards.
- Be realistic, fair, and unbiased.

Score the answer in these areas (0 to 10):

1. Confidence → Clarity, confidence, delivery
2. Communication → Simplicity, fluency, explanation quality
3. Correctness → Technical accuracy, relevance, completeness

Scoring Rules:
- Weak answer → low score
- Average answer → medium score
- Strong answer → high score
- Evaluate according to role and experience level

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number)

Feedback Rules:
- 10 to 15 words only
- Natural human interviewer tone
- Honest and professional
- Can suggest improvement
- Do NOT explain score
- Do NOT repeat question

Return ONLY valid JSON:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`
  },
 {
    role: "user",
    content: `
Candidate Experience: ${interview.experience}
Candidate Level: ${candidateLevel}
Role: ${interview.role}
Question: ${question.question}
Answer: ${answer}
`
}
];


const aiResponse = await askAi(messages);

const cleanedResponse = aiResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

let parsed = JSON.parse(cleanedResponse);
question.answer = answer;
question.confidence = parsed.confidence;
question.communication = parsed.communication;
question.correctness = parsed.correctness;
question.score = parsed.finalScore;
question.feedback = parsed.feedback;
await interview.save();

return res.status(200).json({ feedback: parsed.feedback });

} catch (error) {
    return res.status(500).json({message: `failed to submit answer ${error}`});
}
 }


 export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(400).json({
        message: "Failed to find interview."
      });
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
    const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

    // Candidate Level
    const numericExperience = parseInt(interview.experience) || 0;
    const candidateLevel =
      numericExperience <= 1 ? "Fresher" : "Experienced";

    // Performance Summary
    let performanceLevel = "";
    let overallFeedback = "";

    if (finalScore >= 8) {
      performanceLevel = "Excellent";
      overallFeedback =
        candidateLevel === "Fresher"
          ? "Excellent fresher performance with strong fundamentals and communication."
          : "Excellent professional performance with strong expertise and communication.";
    } else if (finalScore >= 6) {
      performanceLevel = "Good";
      overallFeedback =
        candidateLevel === "Fresher"
          ? "Good fresher performance with room for stronger technical depth."
          : "Good experienced performance with opportunities for stronger leadership and precision.";
    } else if (finalScore >= 4) {
      performanceLevel = "Average";
      overallFeedback =
        candidateLevel === "Fresher"
          ? "Average performance. Improve fundamentals, clarity, and confidence."
          : "Average performance. Improve technical depth, structure, and professional confidence.";
    } else {
      performanceLevel = "Needs Improvement";
      overallFeedback =
        candidateLevel === "Fresher"
          ? "Needs improvement in core concepts, communication, and confidence."
          : "Needs improvement in expertise, communication, and decision-making.";
    }

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      candidateLevel,
      performanceLevel,
      overallFeedback,
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0
      }))
    });

  } catch (error) {
    return res.status(500).json({
      message: `Failed to finish interview: ${error.message}`
    });
  }
};





export const getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId }) // find all interviews
            .sort({ createdAt: -1 }) // latest first
            .select("role experience mode finalScore status createdAt");

        return res.status(200).json(interviews);

    } catch (error) {
        return res.status(500).json({
            message: `Failed to find current user interviews: ${error.message}`
        });
    }
};




export const getInterviewReport = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found"
            });
        }

        const totalQuestions = interview.questions.length;

        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;
        let totalScore = 0;

        interview.questions.forEach((q) => {
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
            totalScore += q.score || 0;
        });

        const avgConfidence = totalQuestions
            ? totalConfidence / totalQuestions
            : 0;

        const avgCommunication = totalQuestions
            ? totalCommunication / totalQuestions
            : 0;

        const avgCorrectness = totalQuestions
            ? totalCorrectness / totalQuestions
            : 0;

        const finalScore = totalQuestions
            ? totalScore / totalQuestions
            : 0;

        // Candidate Level Detection
        const numericExperience = parseInt(interview.experience) || 0;
        const candidateLevel =
            numericExperience <= 1 ? "Fresher" : "Experienced";

        // Performance Summary
        let performanceLevel = "";
        let overallFeedback = "";

        if (finalScore >= 8) {
            performanceLevel = "Excellent";
            overallFeedback =
                candidateLevel === "Fresher"
                    ? "Excellent fresher performance with strong fundamentals and communication."
                    : "Excellent experienced performance with strong professional expertise.";
        } else if (finalScore >= 6) {
            performanceLevel = "Good";
            overallFeedback =
                candidateLevel === "Fresher"
                    ? "Good fresher performance with room for stronger technical depth."
                    : "Good experienced performance with opportunities for stronger leadership.";
        } else if (finalScore >= 4) {
            performanceLevel = "Average";
            overallFeedback =
                candidateLevel === "Fresher"
                    ? "Average fresher performance. Improve confidence and fundamentals."
                    : "Average experienced performance. Improve technical precision and structure.";
        } else {
            performanceLevel = "Needs Improvement";
            overallFeedback =
                candidateLevel === "Fresher"
                    ? "Needs improvement in fundamentals, communication, and confidence."
                    : "Needs improvement in professional expertise and decision-making.";
        }

        return res.status(200).json({
            role: interview.role,
            experience: interview.experience,
            candidateLevel,
            mode: interview.mode,
            status: interview.status,

            performanceLevel,
            overallFeedback,

            finalScore: Number(finalScore.toFixed(1)),
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),

            questionWiseScore: interview.questions.map((q) => ({
                question: q.question,
                answer: q.answer || "",
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
                difficulty: q.difficulty || ""
            }))
        });

    } catch (error) {
    return res.status(500).json({
        message: `failed to find currentUser Interview ${error}`
    });
}
}

