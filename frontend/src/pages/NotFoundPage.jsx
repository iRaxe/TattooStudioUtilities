import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Errore 404</p>
      <h1 className="mt-4 text-4xl font-semibold text-foreground">Pagina non trovata</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        La risorsa che stai cercando potrebbe essere stata rimossa, rinominata o non è temporaneamente disponibile.
      </p>
      <Button className="mt-6" asChild>
        <Link to="/">Torna alla home</Link>
      </Button>
    </div>
  )
}
