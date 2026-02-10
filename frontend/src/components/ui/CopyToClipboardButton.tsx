import Button from "@/components/ui/Button";

export default function CopyToClipboardButton({
  className,
  children,
}: {
  className?: string;
  children: string;
}) {
  return (
    <Button variant="light" size="small" className={className}>
      {children}
    </Button>
  );
}
