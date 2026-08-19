import * as AvatarPrimitive from "@radix-ui/react-avatar";

export function Avatar() {
  return (
    <AvatarPrimitive.Root className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-card">
      <AvatarPrimitive.Fallback>NH</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
