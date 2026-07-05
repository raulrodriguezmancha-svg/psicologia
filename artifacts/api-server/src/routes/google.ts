import { Router, type IRouter } from "express";
import { db, googleTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { logger } from "../lib/logger";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL ?? "http://localhost:3000"}/api/google/callback`
  );
}

const router: IRouter = Router();

router.get("/google/auth", (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Código no proporcionado");
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    logger.info({ hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token }, "Tokens recibidos de Google");

    if (!tokens.access_token) {
      res.status(400).send("No se recibió access token de Google");
      return;
    }

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const email = userInfo.email;

    if (!email) {
      res.status(400).send("No se pudo obtener el email de la cuenta Google");
      return;
    }

    await db
      .insert(googleTokensTable)
      .values({
        userEmail: email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ?? Date.now() + 3600_000,
      })
      .onConflictDoUpdate({
        target: googleTokensTable.userEmail,
        set: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date ?? Date.now() + 3600_000,
          updatedAt: new Date(),
        },
      });

    logger.info({ email }, "Google Calendar conectado correctamente");

    const html = `<!DOCTYPE html><html><head><title>Google Conectado</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f0e8}.card{background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);text-align:center;max-width:400px}.check{font-size:48px;margin-bottom:16px}h2{color:#b8912d;margin-bottom:8px}p{color:#666}</style></head><body><div class="card"><div class="check">✅</div><h2>Google Calendar conectado</h2><p>Tu cuenta <strong>${email}</strong> está vinculada. Ya puedes cerrar esta ventana.</p></div></body></html>`;
    res.send(html);
  } catch (err) {
    logger.error({ err }, "Error en callback de Google OAuth");
    res.status(500).send("Error al autenticar con Google. Inténtalo de nuevo.");
  }
});

router.get("/google/status", async (req, res): Promise<void> => {
  const [token] = await db.select().from(googleTokensTable).limit(1);
  res.json({
    connected: !!token,
    email: token?.userEmail ?? null,
  });
});

router.delete("/google/disconnect", async (req, res): Promise<void> => {
  await db.delete(googleTokensTable);
  res.json({ success: true });
});

export async function getGoogleAuthForBooking(): Promise<InstanceType<typeof google.auth.OAuth2> | null> {
  const [token] = await db.select().from(googleTokensTable).limit(1);
  if (!token) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate,
  });

  oauth2Client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await db
        .update(googleTokensTable)
        .set({
          accessToken: newTokens.access_token,
          expiryDate: newTokens.expiry_date ?? Date.now() + 3600_000,
          updatedAt: new Date(),
        })
        .where(eq(googleTokensTable.userEmail, token.userEmail));
    }
  });

  return oauth2Client;
}

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  date: string;
  time: string;
  durationMinutes: number;
}): Promise<string | null> {
  const auth = await getGoogleAuthForBooking();
  if (!auth) {
    logger.warn("Google Calendar no conectado — saltando creación de evento");
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = new Date(`${params.date}T${params.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + params.durationMinutes * 60_000);

    const event = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: startDateTime.toISOString(), timeZone: "Europe/Madrid" },
        end: { dateTime: endDateTime.toISOString(), timeZone: "Europe/Madrid" },
        conferenceData: {
          createRequest: {
            requestId: `booking-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink = event.data.hangoutLink ?? null;
    const eventId = event.data.id ?? null;

    logger.info({ eventId, meetLink }, "Evento creado en Google Calendar");
    return meetLink;
  } catch (err) {
    logger.error({ err }, "Error al crear evento en Google Calendar");
    return null;
  }
}

export default router;
