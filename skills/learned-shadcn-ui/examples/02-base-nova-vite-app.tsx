import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toaster, toast } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

const plans = [
  { label: "Select a plan", value: null },
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
]

export function App() {
  return (
    <TooltipProvider>
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        {/* Base UI: render prop instead of asChild */}
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Base UI dialog</DialogTitle>
              <DialogDescription>Trigger uses render={"{<Button />}"}.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Non-button render target needs nativeButton={false} */}
        <Button render={<a href="#docs" />} nativeButton={false}>
          Link styled as button
        </Button>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="plan">Plan</FieldLabel>
            {/* Base UI: items prop, null-value placeholder item */}
            <Select items={plans}>
              <SelectTrigger id="plan" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {plans.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Period (ToggleGroup: array defaultValue)</FieldLabel>
            <ToggleGroup defaultValue={["daily"]} spacing={2}>
              <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
              <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>Volume (Slider: scalar)</FieldLabel>
            <Slider defaultValue={50} max={100} step={1} />
          </Field>
        </FieldGroup>

        <Accordion defaultValue={["a"]}>
          <AccordionItem value="a">
            <AccordionTrigger>Accordion (no type prop)</AccordionTrigger>
            <AccordionContent>array defaultValue, optional multiple</AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={() => toast.add({ title: "Saved" })}>Toast (Base UI manager)</Button>
        <Toaster />
      </div>
    </TooltipProvider>
  )
}

export default App
