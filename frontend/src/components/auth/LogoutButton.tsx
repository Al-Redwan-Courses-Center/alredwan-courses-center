"use client";

import { signOut } from "next-auth/react";
import Button, { type ButtonProps } from "@/components/ui/Button";

export default function LogoutButton({ ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      onClick={async (e) => {
        await signOut();
        props.onClick?.(e);

        window.location.replace("/");
      }}
    >
      {props.children}
    </Button>
  );
}
