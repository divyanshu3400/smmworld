// src/routes/authHelpers.ts
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email";

/**
 * Sends a magic link to a user created via guest checkout so they can
 * log in and see the order they just paid for without ever setting a password.
 */
export async function sendGuestMagicLink(userId: string) {
  const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !userData.user?.email) {
    logger.error({ err: error, userId }, "Could not fetch user for magic link");
    return;
  }

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
  });

  if (linkErr || !linkData) {
    logger.error({ err: linkErr, userId }, "Failed to generate magic link");
    return;
  }

  await sendEmail({
    to: userData.user.email,
    subject: "Track your order",
    html: `<p>Your order is confirmed! <a href="${linkData.properties.action_link}">Click here to log in and track it</a>.</p>`,
  });
}