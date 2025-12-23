import { testimonials } from "@/dev-data/testimonials";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "success",
    data: {
      testimonials,
    },
  });
}
