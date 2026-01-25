"use client";

import Button, { ButtonProps } from "@/components/ui/Button";
import { signOut } from "next-auth/react";

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
