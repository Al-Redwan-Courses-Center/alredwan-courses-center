import { publicInstructor } from "@/dev-data/instructors";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "success",
    data: {
      instructors: publicInstructor,
    },
  });
}
