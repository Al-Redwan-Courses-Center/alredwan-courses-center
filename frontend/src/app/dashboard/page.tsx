import { redirect } from "next/navigation";
import { getUser } from "@/actions/auth";

export default async function Page() {
  const user = await getUser();

  switch (user.role) {
    case "admin":
      redirect("/dashboard/todays-staff-attendances");
    case "instructor":
      redirect("/dashboard/todays-schedule");
    case "parent":
    case "student":
    default:
      redirect("/dashboard/overview");
  }
}

