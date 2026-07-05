import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Star, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

const API = "/api";

type TokenInfo = { valid: boolean; clientName: string; serviceName: string; date: string };

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            size={32}
            className={`transition-colors ${star <= (hover || value) ? "fill-accent text-accent" : "text-muted stroke-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/reviews/form/${token}`)
      .then(async r => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error ?? "Enlace no válido");
        }
        return r.json();
      })
      .then(data => {
        setTokenInfo(data);
        setAuthorName(data.clientName?.split(" ")[0] ?? "");
      })
      .catch(err => setTokenError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setSubmitError("Por favor elige una valoración de 1 a 5 estrellas."); return; }
    if (comment.trim().length < 10) { setSubmitError("El comentario debe tener al menos 10 caracteres."); return; }
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/reviews/form/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim(), authorName: authorName.trim() || tokenInfo?.clientName }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error ?? "Error al enviar la reseña.");
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError("Error de conexión. Por favor inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    return `${parseInt(day,10)} de ${MONTHS_ES[parseInt(m,10)-1]} de ${y}`;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <AlertCircle size={56} className="text-muted-foreground/60" />
        <div>
          <h2 className="text-2xl font-serif text-foreground font-medium mb-2">Enlace no válido</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">{tokenError}</p>
        </div>
        <Link href="/"><Button variant="outline" className="rounded-full">Volver al inicio</Button></Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-3xl font-serif text-foreground font-medium mb-3">¡Gracias por tu reseña!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Tu opinión ha sido recibida y será publicada tras su revisión. Te agradezco mucho que hayas compartido tu experiencia.
          </p>
        </div>
        <Link href="/resenas"><Button variant="outline" className="rounded-full">Ver todas las reseñas</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground font-medium mb-3">
            Deja tu reseña
          </h1>
          {tokenInfo && (
            <p className="text-muted-foreground">
              Sesión de <strong>{tokenInfo.serviceName}</strong> del {formatDate(tokenInfo.date)}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Tu valoración *</Label>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {["", "Muy mala", "Mala", "Regular", "Buena", "¡Excelente!"][rating]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Cómo quieres que aparezca tu nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: María L."
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Puedes usar solo tu nombre o iniciales para mantener tu privacidad.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Tu experiencia *</Label>
                <Textarea
                  id="comment"
                  placeholder="Cuéntanos cómo fue tu experiencia con Alba, cómo te ayudaron las sesiones..."
                  rows={5}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{comment.length} caracteres (mínimo 10)</p>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {submitError}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full rounded-full h-12">
                {submitting ? (
                  <><Loader2 className="animate-spin mr-2" size={16}/>Enviando...</>
                ) : (
                  <><Send size={16} className="mr-2"/>Enviar reseña</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Tu reseña será revisada antes de publicarse. Este enlace es de uso único.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
