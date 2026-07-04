import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function About() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.20))] bg-background">
      <div className="bg-secondary/40 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground font-medium mb-6">Sobre mí</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Conoce mi trayectoria, enfoque terapéutico y cómo podemos trabajar juntos hacia tu bienestar.
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
                <h3 className="font-serif text-xl font-medium border-b border-border pb-4">Credenciales</h3>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Psicóloga Sanitaria Colegiada</strong> (M-12345)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Grado en Psicología</strong> por la Universidad Autónoma de Madrid</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span><strong>Máster en Psicología Clínica y de la Salud</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Formación avanzada en Terapias de Tercera Generación y Mindfulness</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-12">
            <section className="prose prose-lg prose-p:text-muted-foreground prose-headings:font-serif prose-headings:text-foreground prose-headings:font-medium max-w-none">
              <h2>Mi historia</h2>
              <p>
                Desde que comencé mis estudios en Psicología, tuve claro que mi vocación era acompañar a las personas en sus procesos de cambio y autodescubrimiento. A lo largo de mi carrera profesional, he trabajado en diversos centros clínicos, lo que me ha permitido nutrirme de la experiencia de acompañar a personas con realidades muy distintas.
              </p>
              <p>
                Entiendo la terapia como un trabajo en equipo: tú eres el experto en tu vida y yo aporto el conocimiento científico y las herramientas psicológicas. Mi objetivo es crear un entorno cálido, seguro y confidencial donde te sientas con total libertad para ser tú mismo.
              </p>
              
              <h2>Mi enfoque terapéutico</h2>
              <p>
                Mi forma de trabajar se basa en un <strong>enfoque integrador</strong>. Esto significa que no aplico el mismo molde a todas las personas, sino que adapto la intervención a tus necesidades específicas. 
              </p>
              <p>
                Parto de una base cognitivo-conductual (la orientación con mayor respaldo científico), pero la enriquezco con terapias humanistas y técnicas de aceptación y compromiso (ACT), prestando especial atención a la gestión emocional y al contexto vital de cada paciente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-foreground font-medium mb-6">Especialidades</h2>
              <div className="flex flex-wrap gap-3">
                {["Ansiedad y Estrés", "Depresión", "Terapia de Pareja", "Trauma", "Gestión Emocional", "Autoestima", "Duelo", "Crecimiento Personal"].map(spec => (
                  <Badge key={spec} variant="secondary" className="px-4 py-2 text-sm font-normal rounded-full bg-secondary text-secondary-foreground">
                    {spec}
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
