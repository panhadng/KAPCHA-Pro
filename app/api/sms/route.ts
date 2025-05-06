import { NextRequest, NextResponse } from "next/server";
import { TwilioService } from "@/app/services/twilioService";

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();
    if (!to || !body) {
      return NextResponse.json(
        { error: "Phone number and message are required." },
        { status: 400 }
      );
    }
    const message = await TwilioService.sendSMS(to, body);
    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: unknown) {
    console.error("SMS API error:", error);
    let message = "Failed to send SMS.";
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 }  );
  }
}
