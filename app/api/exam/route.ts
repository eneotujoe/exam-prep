// import { questionSchema, questionsSchema } from "@/lib/schemas";
// import { google } from "@ai-sdk/google";
// import { streamObject } from "ai";

// export const maxDuration = 60;

// export async function POST(req: Request) {
//   const { files } = await req.json();
//   const firstFile = files[0].data;

//   const result = streamObject({
//     model: google("gemini-1.5-pro-latest"),
//     messages: [
//       {
//         role: "system",
//         content:
//           "You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length.",
//       },
//       {
//         role: "user",
//         content: [
//           {
//             type: "text",
//             text: "Create a multiple choice test based on this document.",
//           },
//           {
//             type: "file",
//             data: firstFile,
//             mimeType: "application/pdf",
//           },
//         ],
//       },
//     ],
//     schema: questionSchema,
//     output: "array",
//     onFinish: ({ object }) => {
//       const res = questionsSchema.safeParse(object);
//       if (res.error) {
//         throw new Error(res.error.errors.map((e) => e.message).join("\n"));
//       }
//     },
//   });

//   return result.toTextStreamResponse();
// }
import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log("API route called");
    
    // Check if request body exists
    if (!req.body) {
      console.error("No request body");
      return new Response(
        JSON.stringify({ error: "No request body provided" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { files } = await req.json();
    console.log("Files received:", files?.length || 0);
    
    // Validate input
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const firstFile = files[0];
    
    // Validate file structure
    if (!firstFile?.data) {
      console.error("Invalid file structure:", firstFile);
      return new Response(
        JSON.stringify({ error: "Invalid file format - missing data" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("File data length:", firstFile.data?.length || 0);
    console.log("File MIME type:", firstFile.mimeType || "not specified");
    console.log("File data type:", typeof firstFile.data);

    // Validate file data format (should be base64 string)
    if (typeof firstFile.data !== 'string') {
      console.error("Invalid file data type:", typeof firstFile.data);
      return new Response(
        JSON.stringify({ error: "File data must be base64 string" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set default MIME type if not provided
    const mimeType = firstFile.mimeType || "application/pdf";
    console.log("Using MIME type:", mimeType);

    console.log("Starting generateObject...");

    // Use generateObject instead of streamObject for simpler handling
    const { object } = await generateObject({
      model: google("gemini-1.5-flash-8b-latest"),
      messages: [
        {
          role: "system",
          content: `You are an experienced educator creating assessment materials. Your task is to:

          1. Analyze the provided document thoroughly
          2. Create exactly 4 multiple choice questions that test comprehension of key concepts
          3. Each question should have 4 answer options (A, B, C, D)
          4. Ensure one correct answer and three plausible distractors
          5. Make all answer options roughly equal in length to avoid bias
          6. Cover different aspects/sections of the document
          7. Use clear, unambiguous language
          8. Avoid questions that rely on memorizing trivial details

          Focus on testing understanding, application, and analysis rather than rote memorization.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this document and create a 4-question multiple choice test that assesses understanding of the main concepts and key information.",
            },
            {
              type: "file",
              data: firstFile.data,
              mimeType: mimeType,
            },
          ],
        },
      ],
      schema: questionsSchema,
    });

    console.log("generateObject finished, validating...");
    
    // Validate the generated questions
    const validation = questionsSchema.safeParse(object);
    if (!validation.success) {
      console.error("Schema validation failed:", validation.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Generated questions don't match expected format",
          details: validation.error.errors
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Additional business logic validation
    const questions = validation.data;
    if (questions.length !== 4) {
      return new Response(
        JSON.stringify({ 
          error: `Expected exactly 4 questions, got ${questions.length}` 
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate each question has 4 options
    for (const [index, question] of questions.entries()) {
      if (!question.options || question.options.length !== 4) {
        return new Response(
          JSON.stringify({ 
            error: `Question ${index + 1} must have exactly 4 options` 
          }), 
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
      //   return new Response(
      //     JSON.stringify({ 
      //       error: `Question ${index + 1} has invalid correct answer` 
      //     }), 
      //     { status: 400, headers: { "Content-Type": "application/json" } }
      //   );
      // }
    }
    
    console.log("Validation successful, returning questions");
    
    return new Response(
      JSON.stringify(questions), 
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate quiz", 
        message: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}