# Verified bootstrap + experiment commands (Windows PowerShell, shadcn 4.22.1)
# Non-interactive new projects (always pass -t -b -p -n --no-monorepo):
npx shadcn@latest init -t next -b radix -p nova -n shadcn-lab --no-monorepo -y
npx shadcn@latest init -t vite -b base  -p nova -n shadcn-lab-vite --no-monorepo -y
# If init dies on a network timeout, re-run INSIDE the project:
npx shadcn@latest init -b radix -p nova -f -y --no-reinstall

# Inspect
npx shadcn@latest info                      # add --json for agents
npx shadcn@latest preset decode a2r6bw --json
npx shadcn@latest preset resolve
npx shadcn@latest search '@shadcn' -q sidebar -l 6     # quote @ in PowerShell
npx shadcn@latest docs button dialog        # prints links only
npx shadcn@latest view '@shadcn/login-03'

# Add / preview / diff / update
npx shadcn@latest add button card dialog field input label select --dry-run
npx shadcn@latest add button card dialog field input label select -y
npx shadcn@latest add dashboard-01 -y       # then wrap layout in <TooltipProvider>
npx shadcn@latest add badge --diff          # '-' local, '+' upstream
npx shadcn@latest apply a2r6bw --only theme -y

# Custom registry (write registry.json WITHOUT a BOM)
npx shadcn@latest build                     # -> public/r/*.json
# copy a built item under the consumer project, then (path must start ./ or /):
npx shadcn@latest add ./r-local/hello-card.json -y

# Migrations
npx shadcn@latest migrate icons --from lucide --to phosphor -y
