import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListServices, useGetReviewStats, useGetBookingStats } from "@workspace/api-client-react";
import { ArrowRight, Star, Calendar, HeartHandshake } from "lucide-react";

export default function Home() {
  const { data: services, isLoading: loadingServices } = useListServices();
  const { data: reviewStats } = useGetReviewStats();
  const { data: bookingStats } = useGetBookingStats();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-secondary/30">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="/hero-calm.png" 
            alt="Paisaje en calma" 
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 py-20 flex flex-col items-start max-w-4xl mr-auto ml-4 md:ml-12 lg:ml-20">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Terapia online
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-foreground font-medium leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 delay-150 fill-mode-both">
            Un espacio seguro <br />
            para <span className="text-primary italic">volver a ti</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 delay-300 fill-mode-both">
            Acompañamiento psicológico profesional para superar la ansiedad, el estrés y reconectar con tu bienestar emocional. Da el primer paso hoy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 delay-500 fill-mode-both">
            <Link href="/reservar">
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25">
                Reserva tu primera sesión
              </Button>
            </Link>
            <Link href="/sobre-mi">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur">
                Conóceme
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="w-full bg-primary text-primary-foreground py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-primary-foreground/20">
          <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-5 w-5 fill-accent text-accent" />
              <Star className="h-5 w-5 fill-accent text-accent" />
              <Star className="h-5 w-5 fill-accent text-accent" />
              <Star className="h-5 w-5 fill-accent text-accent" />
              <Star className="h-5 w-5 fill-accent text-accent" />
            </div>
            <p className="text-2xl font-serif font-medium">{reviewStats?.averageRating?.toFixed(1) || "5.0"}</p>
            <p className="text-sm opacity-80">Media de valoraciones</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <Calendar className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-2xl font-serif font-medium">{bookingStats?.completed ? bookingStats.completed + 500 : "+500"}</p>
            <p className="text-sm opacity-80">Sesiones realizadas</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <HeartHandshake className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-2xl font-serif font-medium">Enfoque integrador</p>
            <p className="text-sm opacity-80">Terapia adaptada a ti</p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/alba-headshot.png" 
                alt="Alba García Santillana" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
            </div>
          </div>
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium">Hola, soy Alba García.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Como psicóloga clínica, mi objetivo es ofrecerte un espacio de escucha libre de juicios, donde podamos explorar juntos las dificultades que atraviesas y encontrar herramientas eficaces para mejorar tu calidad de vida.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Trabajo desde un enfoque integrador, combinando técnicas cognitivo-conductuales, terapias de tercera generación y una profunda base humanista.
            </p>
            <div className="pt-4">
              <Link href="/sobre-mi" className="inline-flex items-center text-primary font-medium hover:underline underline-offset-4">
                Leer más sobre mi formación <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground font-medium mb-4">¿En qué puedo ayudarte?</h2>
            <p className="text-muted-foreground text-lg">Sesiones personalizadas en modalidad online, diseñadas para adaptarse a tus necesidades y ritmo desde la comodidad de tu hogar.</p>
          </div>
          
          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse border-none shadow-md h-64 bg-background" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.slice(0, 3).map((service) => (
                <Card key={service.id} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-background flex flex-col">
                  <CardContent className="p-8 flex flex-col h-full">
                    <h3 className="text-xl font-serif font-medium mb-3">{service.name}</h3>
                    <p className="text-muted-foreground mb-6 flex-grow">{service.description.substring(0, 120)}...</p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                      <span className="font-medium text-foreground">{service.price}€ / sesión</span>
                      <Link href="/reservar">
                        <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">Reservar</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <Link href="/servicios">
              <Button size="lg" className="rounded-full px-8">Ver todos los servicios</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
