import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const enfoques = [
  {
    siglas: "TCC",
    nombre: "Terapia Cognitivo-Conductual",
    descripcion:
      "Identificación y modificación de pensamientos y conductas que generan malestar. El enfoque con mayor respaldo científico en el tratamiento de la ansiedad, la depresión y muchos otros problemas psicológicos.",
  },
  {
    siglas: "ACT",
    nombre: "Terapia de Aceptación y Compromiso",
    descripcion:
      "Desarrollo de la flexibilidad psicológica para actuar de acuerdo con tus valores, incluso en presencia de emociones difíciles. Te ayuda a relacionarte de otra forma con tus pensamientos y sentimientos.",
  },
  {
    siglas: "AF",
    nombre: "Análisis Funcional",
    descripcion:
      "Comprensión de qué desencadena y mantiene un problema para diseñar una intervención adaptada. Analizamos la relación entre tus pensamientos, emociones, conductas y contexto.",
  },
  {
    siglas: "DBT",
    nombre: "Terapia Dialéctico-Conductual",
    descripcion:
      "Entrenamiento en regulación emocional, tolerancia al malestar, mindfulness y habilidades interpersonales. Especialmente útil cuando las emociones se sienten muy intensas o difíciles de manejar.",
  },
];

const motivosConsulta = [
  "Ansiedad y estrés",
  "Depresión y bajo estado de ánimo",
  "Autoestima",
  "Gestión emocional",
  "Relaciones de pareja",
  "Dependencia emocional",
  "Duelo",
  "Crecimiento personal",
  "Funcionamiento cognitivo",
  "Otros",
];

export default function About() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-4">Sobre mí</h1>
          <p className="text-base font-medium text-primary tracking-wider uppercase mb-4">
            Psicóloga y Neuropsicóloga
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Acompañamiento profesional, cercano y basado en la evidencia científica para ayudarte a vivir mejor.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/alba-headshot.png"
                alt="Alba García Santillana en su consulta"
                className="w-full h-full object-cover"
              />
            </div>

            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 md:p-8 space-y-6">
                <h3 className="font-serif text-xl font-medium border-b border-border pb-4">Formación</h3>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Grado en Psicología</strong> – Universidad de Extremadura</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Máster en Psicología General Sanitaria</strong> – Universidad Europea Miguel de Cervantes</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Máster en Neuropsicología Clínica</strong> – Universidad Internacional de Valencia</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Experto en Prevención e Intervención en la Conducta Suicida – AEPSIS</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Curso Habilidades de Comunicación – Universidad Internacional de Valencia</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Curso Inteligencia Emocional – Universidad Internacional de Valencia</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Curso Resiliencia – Universidad Internacional de Valencia</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Curso Solución de Problemas – Universidad Internacional de Valencia</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-14">
            <section className="prose prose-lg prose-p:text-muted-foreground prose-headings:font-serif prose-headings:text-foreground prose-headings:font-medium max-w-none">
              <h2>Mi historia</h2>
              <p>
                Desde que comencé mis estudios en Psicología, tuve claro que mi vocación era acompañar a las personas en sus procesos de cambio y autodescubrimiento. A lo largo de mi carrera profesional he trabajado en diversos contextos clínicos, lo que me ha permitido crecer como profesional y acompañar a personas con realidades muy distintas.
              </p>
              <p>
                Entiendo la terapia como un trabajo en equipo: tú eres el experto en tu vida y yo aporto el conocimiento científico y las herramientas psicológicas. Mi objetivo es crear un entorno cálido, seguro y confidencial donde te sientas libre para ser tú mismo y avanzar hacia la vida que quieres construir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-foreground font-medium mb-2">Enfoques terapéuticos</h2>
              <p className="text-muted-foreground mb-6">
                No aplico el mismo molde a todas las personas. Adapto la intervención a tu situación específica combinando los siguientes métodos basados en la evidencia:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enfoques.map((e) => (
                  <Card key={e.siglas} className="border border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm px-3 py-1 shrink-0">
                          {e.siglas}
                        </span>
                        <h4 className="font-serif font-medium text-foreground leading-snug">{e.nombre}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{e.descripcion}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-foreground font-medium mb-2">Neuropsicología</h2>
              <Card className="border border-border/60 shadow-sm bg-card">
                <CardContent className="p-5 md:p-6">
                  <h4 className="font-serif font-medium text-foreground mb-2">Evaluación, Rehabilitación y Estimulación Cognitiva</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Valoración neuropsicológica e intervención para mejorar el funcionamiento cognitivo y la calidad de vida. Trabajo con personas que presentan dificultades de memoria, atención, funciones ejecutivas u otras áreas cognitivas.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Rehabilitación de funciones cognitivas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Programas de estimulación cognitiva personalizados</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Evaluación de memoria, atención, lenguaje y funciones ejecutivas</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-foreground font-medium mb-4">Motivos de consulta</h2>
              <div className="flex flex-wrap gap-3">
                {motivosConsulta.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="px-4 py-2 text-sm font-normal rounded-full bg-secondary text-secondary-foreground"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
