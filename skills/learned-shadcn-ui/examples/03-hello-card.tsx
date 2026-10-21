import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HelloCard({ name }: { name: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-brand">Hello {name}</CardTitle></CardHeader>
      <CardContent><Button>Greet</Button></CardContent>
    </Card>
  )
}
