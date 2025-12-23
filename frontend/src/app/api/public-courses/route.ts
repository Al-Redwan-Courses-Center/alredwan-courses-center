import { courses } from "@/dev-data/public-courses";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "success",
    data: {
      courses,
    },
  });
}
