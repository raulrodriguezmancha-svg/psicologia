import { logger } from "./logger";
import { google } from "googleapis";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function getOAuth2Client() {
  const { getGoogleAuthForBooking } = await import("../routes/google.js");
  return getGoogleAuthForBooking();
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const fromName = process.env.FROM_NAME ?? "Alba García Santillana";
  const gmailUser = process.env.GMAIL_USER;

  if (!gmailUser) {
    logger.info({ to: options.to, subject: options.subject }, "[EMAIL - no enviado, GMAIL_USER no configurado] " + options.subject);
    return;
  }

  const auth = await getOAuth2Client();
  if (!auth) {
    logger.warn("[EMAIL - no enviado, Google no conectado] " + options.subject);
    return;
  }

  const boundary = "boundary_" + Math.random().toString(36).slice(2);
  const rawMessage = [
    `From: "${fromName}" <${gmailUser}>`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    Buffer.from(options.html).toString("base64"),
    `--${boundary}--`,
  ].join("\r\n");

  const gmail = google.gmail({ version: "v1", auth });

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: Buffer.from(rawMessage).toString("base64url"),
      },
    });
    logger.info({ to: options.to, subject: options.subject }, "Email enviado via Gmail API");
  } catch (err) {
    logger.error({ err, to: options.to }, "Error al enviar email via Gmail API");
  }
}

export function bookingConfirmationHtml(params: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  depositAmount: number;
  meetLink?: string;
}): string {
  const meetSection = params.meetLink
    ? `
  <div style="text-align:center;margin:24px 0">
    <a href="${params.meetLink}" style="background:#b8912d;color:white;padding:14px 28px;text-decoration:none;border-radius:24px;font-size:16px;font-family:Georgia,serif;display:inline-block">
      Unirse a Google Meet
    </a>
  </div>
  <p style="font-size:13px;color:#888;text-align:center">Este enlace es para tu sesión online. Guárdalo, lo necesitarás el día de tu cita.</p>`
    : `
  <p>Recibirás el enlace de videollamada poco antes de la sesión.</p>`;

  return `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#3d2b1a;padding:24px">
  <h2 style="color:#b8912d;margin-bottom:8px">¡Tu cita está confirmada!</h2>
  <p>Hola <strong>${params.clientName}</strong>,</p>
  <p>Tu señal de reserva ha sido recibida correctamente. Aquí tienes los detalles de tu cita:</p>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr style="background:#fdf8f0"><td style="padding:10px 14px;font-weight:bold">Servicio</td><td style="padding:10px 14px">${params.serviceName}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:bold">Fecha</td><td style="padding:10px 14px">${params.date}</td></tr>
    <tr style="background:#fdf8f0"><td style="padding:10px 14px;font-weight:bold">Hora</td><td style="padding:10px 14px">${params.time}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:bold">Señal abonada</td><td style="padding:10px 14px">${params.depositAmount}€</td></tr>
  </table>
  ${meetSection}
  <p>Si necesitas cancelar, hazlo con al menos 48 h de antelación.</p>
  <p style="margin-top:24px">Un saludo,<br><strong>Alba García Santillana</strong><br><em>Psicóloga y Neuropsicóloga</em></p>
</div>`;
}

export function reviewInvitationHtml(params: {
  clientName: string;
  reviewUrl: string;
  expiresAt: string;
}): string {
  return `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#3d2b1a;padding:24px">
  <h2 style="color:#b8912d;margin-bottom:8px">¿Cómo fue tu experiencia?</h2>
  <p>Hola <strong>${params.clientName}</strong>,</p>
  <p>Gracias por confiar en mí para acompañarte en tu proceso. Si lo deseas, me gustaría saber cómo fue tu experiencia para seguir mejorando.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${params.reviewUrl}" style="background:#b8912d;color:white;padding:14px 28px;text-decoration:none;border-radius:24px;font-size:16px;font-family:Georgia,serif">
      Escribir mi reseña
    </a>
  </div>
  <p style="font-size:12px;color:#888;text-align:center">Este enlace es personal e intransferible. Caduca el ${params.expiresAt}.</p>
  <p style="margin-top:24px">Muchas gracias,<br><strong>Alba García Santillana</strong><br><em>Psicóloga y Neuropsicóloga</em></p>
</div>`;
}
