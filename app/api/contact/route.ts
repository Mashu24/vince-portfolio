import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const recipient = "magamponvince@gmail.com";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        {
          error:
            "Email sending is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment."
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const safeName = String(name || "Portfolio Visitor").slice(0, 120);
    const safeEmail = String(email || "Not provided").slice(0, 160);
    const safeMessage = String(message).slice(0, 4000);

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.GMAIL_USER}>`,
      to: recipient,
      replyTo: safeEmail.includes("@") ? safeEmail : undefined,
      subject: `Portfolio Contact Form - ${safeName}`,
      text: [
        "New portfolio contact message",
        "",
        `Name: ${safeName}`,
        `Email: ${safeEmail}`,
        "",
        "Message:",
        safeMessage
      ].join("\n")
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
