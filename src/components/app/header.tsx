import { Icons } from "@/components/icons";
import { SettingsDialog } from "./settings-dialog";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">ImageMeta Pro</h1>
        </div>
        <SettingsDialog />
      </div>
    </header>
  );
}
