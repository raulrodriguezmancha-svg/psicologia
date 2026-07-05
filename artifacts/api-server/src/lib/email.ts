import { logger } from "./logger";
import emailjs from "@emailjs/nodejs";

interface EmailOptions {
  to: string;
  templateParams: Record<string, string>;
}

function initEmailJS() {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (publicKey && privateKey) {
    emailjs.init({ publicKey, privateKey });
  } else if (publicKey) {
    emailjs.init({ publicKey });
  }
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  depositAmount: number;
  meetLink?: string;
}): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_BOOKING_TEMPLATE_ID ?? process.env.EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    logger.warn("[EMAIL - no enviado, EMAILJS_SERVICE_ID o EMAILJS_TEMPLATE_ID no configurado]");
    return;
  }

  initEmailJS();

  try {
    await emailjs.send(serviceId, templateId, {
      to_email: params.to,
      client_name: params.clientName,
      service_name: params.serviceName,
      date: params.date,
      time: params.time,
      deposit_amount: String(params.depositAmount),
      meet_link: params.meetLink ?? "",
    });
    logger.info({ to: params.to }, "Email de confirmación enviado via EmailJS");
  } catch (err) {
    logger.error({ err, to: params.to }, "Error al enviar email via EmailJS");
  }
}

export async function sendReviewInvitationEmail(params: {
  to: string;
  clientName: string;
  reviewUrl: string;
  expiresAt: string;
}): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_REVIEW_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    logger.warn("[EMAIL - no enviado, EMAILJS_REVIEW_TEMPLATE_ID no configurado]");
    return;
  }

  initEmailJS();

  try {
    await emailjs.send(serviceId, templateId, {
      to_email: params.to,
      client_name: params.clientName,
      review_url: params.reviewUrl,
      expires_at: params.expiresAt,
    });
    logger.info({ to: params.to }, "Email de reseña enviado via EmailJS");
  } catch (err) {
    logger.error({ err, to: params.to }, "Error al enviar email de reseña via EmailJS");
  }
}
