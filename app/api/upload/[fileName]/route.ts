import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Helper: Scan and delete files older than 30 days to prevent server storage growth
async function cleanOldFiles(uploadDir: string) {
  try {
    const files = await fs.readdir(uploadDir);
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > thirtyDaysMs) {
          await fs.unlink(filePath);
          console.log(`[Cleanup] Deleted old PDF from server storage: ${file}`);
        }
      })
    );
  } catch (err) {
    console.error("[Cleanup] Error running auto-delete for old files:", err);
  }
}

// GET /api/upload/[fileName] - Serves the PDF in production
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await props.params;
  const safeFileName = path.basename(fileName);
  
  const uploadDir = path.join(process.cwd(), ".exam-uploads");
  const filePath = path.join(uploadDir, safeFileName);

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

// POST /api/upload/[fileName] - Handles PDF uploads with auto-cleanup
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await props.params;
  const safeFileName = path.basename(fileName);

  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const dataUri = body.dataUri || body.pdf || "";
      if (!dataUri) {
        return NextResponse.json({ error: "Missing PDF data in body" }, { status: 400 });
      }
      const base64Data = dataUri.replace(/^data:application\/pdf;.*base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const arrayBuffer = await request.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const uploadDir = path.join(process.cwd(), ".exam-uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    // Run cleanOldFiles in background to delete PDFs older than 30 days
    cleanOldFiles(uploadDir).catch((err) => console.error("[Cleanup] Background job failed:", err));

    const origin = request.nextUrl.origin;
    let downloadUrl = `${origin}/api/upload/${safeFileName}`;

    // If local, return a trusted public URL (a test PDF from w3.org) that Bitly is guaranteed
    // to shorten successfully during your local testing.
    const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("::1");
    if (isLocal) {
      console.log("[Upload API] Local environment detected. Returning trusted test PDF URL for Bitly compatibility...");
      downloadUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf-test.pdf";
    }

    return NextResponse.json({
      success: true,
      url: downloadUrl,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
