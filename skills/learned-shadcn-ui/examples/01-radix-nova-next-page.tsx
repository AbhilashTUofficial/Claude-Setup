"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Page() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>shadcn lab</CardTitle>
          <CardDescription>radix-nova preset, Next.js 16</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" placeholder="Evil Rabbit" />
              <FieldDescription>Appears on invoices.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="plan">Plan</FieldLabel>
              <Select defaultValue="pro">
                <SelectTrigger id="plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="bad">Username</FieldLabel>
              <Input id="bad" aria-invalid defaultValue="taken" />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={() => toast.success("Saved")}>Save</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>Radix Dialog via asChild.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Table</TabsTrigger>
          <TabsTrigger value="b">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="a">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map((v) => (
                <TableRow key={v}>
                  <TableCell>{v}</TableCell>
                  <TableCell>
                    <Button variant={v} size="sm">
                      {v}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="b">Second tab</TabsContent>
      </Tabs>
    </main>
  )
}
