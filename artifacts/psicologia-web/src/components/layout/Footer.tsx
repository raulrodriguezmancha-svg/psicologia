import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-secondary/30 mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl font-medium text-foreground">Alba García Santillana</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Espacio de psicología clínica y acompañamiento terapéutico. Un entorno seguro y confidencial para tu bienestar emocional.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-medium text-foreground">Enlaces rápidos</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/sobre-mi" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sobre mí</Link>
              <Link href="/servicios" className="text-sm text-muted-foreground hover:text-primary transition-colors">Servicios</Link>
              <Link href="/resenas" className="text-sm text-muted-foreground hover:text-primary transition-colors">Reseñas de pacientes</Link>
              <Link href="/reservar" className="text-sm text-muted-foreground hover:text-primary transition-colors">Reservar una cita</Link>
            </nav>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-medium text-foreground">Contacto</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Colegiada M-12345</p>
              <p>Sesiones online y presenciales</p>
              <p className="mt-2">hello@albagarcia-psicologia.com</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Alba García Santillana Psicología. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
