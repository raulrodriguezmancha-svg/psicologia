import { logger } from "./logger";

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

async function sendEmailJS(templateId: string, templateParams: Record<string, unknown>): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !publicKey) {
    logger.warn("[EMAIL - no enviado, EMAILJS_SERVICE_ID o EMAILJS_PUBLIC_KEY no configurado]");
    return;
  }

  try {
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (privateKey) {
      headers["Authorization"] = `Bearer ${privateKey}`;
    }

    const response = await fetch(EMAILJS_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        template_params: templateParams,
        public_key: publicKey,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "Error al enviar email via EmailJS");
    } else {
      logger.info({ templateId, to: templateParams.to_email }, "Email enviado via EmailJS");
    }
  } catch (err) {
    logger.error({ err }, "Error al enviar email via EmailJS");
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
  const templateId = process.env.EMAILJS_BOOKING_TEMPLATE_ID ?? process.env.EMAILJS_TEMPLATE_ID;

  if (!templateId) {
    logger.warn("[EMAIL - no enviado, EMAILJS_TEMPLATE_ID no configurado]");
    return;
  }

  await sendEmailJS(templateId, {
    to_email: params.to,
    client_name: params.clientName,
    service_name: params.serviceName,
    date: params.date,
    time: params.time,
    deposit_amount: String(params.depositAmount),
    meet_link: params.meetLink ?? "",
  });
}

export async function sendReviewInvitationEmail(params: {
  to: string;
  clientName: string;
  reviewUrl: string;
  expiresAt: string;
}): Promise<void> {
  const templateId = process.env.EMAILJS_REVIEW_TEMPLATE_ID;

  if (!templateId) {
    logger.warn("[EMAIL - no enviado, EMAILJS_REVIEW_TEMPLATE_ID no configurado]");
    return;
  }

  await sendEmailJS(templateId, {
    to_email: params.to,
    client_name: params.clientName,
    review_url: params.reviewUrl,
    expires_at: params.expiresAt,
  });
}
