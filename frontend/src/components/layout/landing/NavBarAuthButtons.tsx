"use client";

import { useIsClient, useMediaQuery } from "usehooks-ts";
import AuthModal from "@/components/auth/AuthModal";
import SignupModal from "@/components/auth/SignupModal";

export function NavBarAuthButtons() {
  const isClient = useIsClient();
  const isSmallLaptop = useMediaQuery("(max-width: 1100px)");

  return (
    <div className="tablet:hidden grid grid-cols-2 items-stretch gap-4">
      <AuthModal />
      {!isClient || isSmallLaptop ? null : <SignupModal />}
    </div>
  );
}
