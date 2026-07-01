// src/lib/email.ts
import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.HOSTINGER_EMAIL_USER, // e.g. noreply@ssmm.online
        pass: process.env.HOSTINGER_EMAIL_PASS,
    },
});

interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
    try {
        await transporter.sendMail({
            from: `"SSMM" <${process.env.HOSTINGER_EMAIL_USER}>`,
            to,
            subject,
            html,
        });
    } catch (err) {
        logger.error({ err, to, subject }, "Failed to send email via Hostinger SMTP");
    }
}