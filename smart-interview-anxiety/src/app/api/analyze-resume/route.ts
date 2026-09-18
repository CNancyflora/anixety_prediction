import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetRole = formData.get("targetRole") as string || "General";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let text = "";

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        text = parsed.text;
      } else if (fileName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        return NextResponse.json({ error: "Unsupported file format. Please upload a valid PDF or DOCX file." }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Text extraction failed. The file may be corrupted or encrypted." }, { status: 400 });
    }

    if (text.length < 50) {
      return NextResponse.json({ error: "No readable content found. If this is a PDF, it may be an image-only scan without extractable text." }, { status: 400 });
    }

    // 1. IS THIS ACTUALLY A RESUME?
    const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();
    
    // Check contact signals
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    const hasPhone = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(text);
    const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
    const hasGithub = /github\.com\//i.test(text);

    // Check headings
    const hasEducation = /(education|academic background|degree|university)/i.test(normalizedText);
    const hasExperience = /(experience|work history|employment|internship)/i.test(normalizedText);
    const hasSkills = /(skills|technical skills|competencies)/i.test(normalizedText);
    const hasProjects = /(projects|personal projects|academic projects)/i.test(normalizedText);
    const hasSummary = /(summary|professional summary|objective|about me)/i.test(normalizedText);

    let resumeEvidence = 0;
    if (hasEmail) resumeEvidence += 2;
    if (hasPhone) resumeEvidence += 2;
    if (hasEducation) resumeEvidence += 2;
    if (hasExperience) resumeEvidence += 2;
    if (hasSkills) resumeEvidence += 1;
    if (hasProjects) resumeEvidence += 1;

    if (resumeEvidence < 4) {
      return NextResponse.json({ 
        error: "DOCUMENT NOT RECOGNIZED. This document does not appear to be a resume.",
        reason: `Only ${resumeEvidence}/10 resume signals detected. We could not identify enough standard information such as contact details, education, skills, or experience.`
      }, { status: 400 });
    }

    // 2. ATS SCORING & COMPONENT ANALYSIS
    
    // Contact Info (10)
    let contactScore = 0;
    if (hasEmail) contactScore += 5;
    if (hasPhone) contactScore += 5;

    // Sections (10)
    const detectedSections: Record<string, "PRESENT" | "MISSING" | "PARTIALLY DETECTED"> = {};
    let sectionScore = 0;
    detectedSections["Contact Information"] = (hasEmail || hasPhone) ? "PRESENT" : "MISSING";
    detectedSections["Professional Summary"] = hasSummary ? "PRESENT" : "MISSING";
    detectedSections["Education"] = hasEducation ? "PRESENT" : "MISSING";
    detectedSections["Experience"] = hasExperience ? "PRESENT" : "MISSING";
    detectedSections["Skills"] = hasSkills ? "PRESENT" : "MISSING";
    detectedSections["Projects"] = hasProjects ? "PRESENT" : "MISSING";

    const presentSections = Object.values(detectedSections).filter(v => v === "PRESENT").length;
    sectionScore = Math.min(10, presentSections * 2);

    // Structure (15)
    // Roughly check if sections appear in logical flow (e.g. contact -> summary -> exp -> ed)
    let structureScore = 15;
    if (!hasExperience && !hasEducation) structureScore -= 5;
    
    // Text Extractability (15)
    // We already know it extracted > 50 chars.
    let textExtractability = 15;
    if (text.length < 500) textExtractability -= 5; // Very short

    // Formatting Findings (15)
    let formattingScore = 15;
    const formattingFindings = [];
    formattingFindings.push({ label: "Text is extractable", ok: true, warn: false, desc: "Document text parsed successfully." });
    
    if (/(table|cell|row|column)/i.test(normalizedText.slice(0, 500))) {
      formattingFindings.push({ label: "Table layout detected", ok: false, warn: true, desc: "Tables can confuse some older ATS parsers." });
      formattingScore -= 2;
    }
    
    const bulletCount = (text.match(/[•·▪-]\s/g) || []).length;
    if (bulletCount > 5) {
      formattingFindings.push({ label: "Bullet points detected", ok: true, warn: false, desc: "Good use of standard bullet formatting." });
    } else {
      formattingFindings.push({ label: "Few bullet points", ok: false, warn: true, desc: "Consider using more bullet points to list responsibilities." });
      formattingScore -= 3;
    }

    // Keyword Analysis (15)
    const ROLE_KEYWORDS: Record<string, string[]> = {
      "Software Developer": ["java", "python", "c++", "git", "sql", "api", "oop", "react", "node", "agile", "aws", "docker"],
      "Data Scientist": ["python", "sql", "pandas", "numpy", "scikit", "machine learning", "statistics", "tableau", "power bi", "deep learning"],
      "Web Developer": ["html", "css", "javascript", "react", "node", "typescript", "git", "responsive", "ui", "api"],
    };
    
    // Find closest dictionary, or fallback
    let targetDict = ROLE_KEYWORDS["Software Developer"]; // fallback
    for (const role in ROLE_KEYWORDS) {
      if (targetRole.toLowerCase().includes(role.toLowerCase())) {
        targetDict = ROLE_KEYWORDS[role];
        break;
      }
    }

    const detectedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    targetDict.forEach(kw => {
      if (normalizedText.includes(kw.toLowerCase())) detectedKeywords.push(kw);
      else missingKeywords.push(kw);
    });

    const matchPercentage = Math.round((detectedKeywords.length / targetDict.length) * 100);
    const keywordScore = Math.min(15, Math.round(15 * (detectedKeywords.length / targetDict.length)));

    // Experience / Projects Content (10)
    let expScore = 10;
    const hasActionVerbs = /(developed|managed|created|led|designed|implemented|improved|increased|reduced)/i.test(normalizedText);
    const hasNumbers = /\b\d+(\%|k|m)?\b/i.test(normalizedText); // Basic check for metrics
    if (!hasActionVerbs) expScore -= 3;
    if (!hasNumbers) expScore -= 3;

    // Readability (10)
    let readabilityScore = 10;
    const words = text.split(/\s+/).length;
    if (words < 100) readabilityScore -= 3;
    if (words > 1200) readabilityScore -= 2;

    const totalScore = contactScore + sectionScore + structureScore + textExtractability + formattingScore + keywordScore + expScore + readabilityScore;

    // Generate Strengths & Improvements based ONLY on detected data
    const strengths = [];
    const improvements = [];

    if (hasEmail && hasPhone) strengths.push("Clear contact information detected.");
    else improvements.push("Ensure both a phone number and email address are clearly visible.");

    if (textExtractability === 15) strengths.push("Text can be extracted successfully.");
    
    if (hasActionVerbs && hasNumbers) strengths.push("Experience descriptions contain action verbs and quantifiable metrics.");
    if (!hasNumbers && (hasExperience || hasProjects)) improvements.push("Add quantifiable metrics (numbers, percentages) to your experience/projects.");

    if (detectedKeywords.length > 5) strengths.push(`Strong keyword match for ${targetRole} role.`);
    if (matchPercentage < 40) improvements.push(`Low keyword match (${matchPercentage}%). Consider adding missing technologies if they match your skills.`);

    if (!hasSummary) improvements.push("Add a concise professional summary that matches your target role.");
    if (bulletCount < 5) improvements.push("Use more bullet points to describe roles instead of large paragraphs.");

    const report = {
      fileType: file.type,
      resumeValidationResult: `✓ Passed (${resumeEvidence}/10 signals)`,
      detectedSections,
      contactInformation: { email: hasEmail, phone: hasPhone, linkedin: hasLinkedIn, github: hasGithub },
      keywordMatches: {
        targetKeywords: targetDict,
        detectedKeywords,
        missingKeywords,
        matchPercentage
      },
      formattingFindings,
      atsScore: totalScore,
      scoreBreakdown: {
        contactInformation: contactScore,
        structure: structureScore,
        sectionHeadings: sectionScore,
        textExtractability,
        formatting: formattingScore,
        targetKeywords: keywordScore,
        experienceProjects: expScore,
        readability: readabilityScore
      },
      strengths,
      improvements
    };

    return NextResponse.json({ report }, { status: 200 });
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    return NextResponse.json({ error: "We couldn't complete the analysis. Please try again." }, { status: 500 });
  }
}
