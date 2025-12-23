import { statistics } from "@/dev-data/statistics";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      status: "success",
      data: {
        statistics,
      },
    },
    { status: 200 },
  );
}
