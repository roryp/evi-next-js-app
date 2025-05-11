import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from the URL parameters
    const filePath = path.join(process.cwd(), "tmp", params.path.join("/"));

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Return the file with the appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename=${path.basename(filePath)}`,
      },
    });
  } catch (error) {
    console.error("Error serving audio file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
