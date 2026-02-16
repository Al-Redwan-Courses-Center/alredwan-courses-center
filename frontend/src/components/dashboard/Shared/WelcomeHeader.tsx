import { StudentUser, Child, ParentUser } from "@/types/dashboard";

interface WelcomeHeaderProps {
  // For student mode
  user?: StudentUser;
  // For child mode (viewed by parent)
  child?: Child;
  // For parent mode or child mode
  parentUser?: ParentUser;
  // Optional: custom subtitle for parent mode
  subtitle?: string;
}

export default function WelcomeHeader({
  user,
  child,
  parentUser,
  subtitle,
}: WelcomeHeaderProps) {
  // Child mode (parent viewing child's dashboard)
  if (child && parentUser) {
    return (
      <div className="tablet:mb-10 tablet:px-8 mobile:mb-6 mobile:px-4 mb-14 ps-16">
        <h1 className="font-medad text-olive-700 tablet:text-4xl mobile:text-3xl text-6xl">
          لوحة تحكم {child.first_name} {child.last_name}
        </h1>
        <p className="text-olive-600 tablet:text-2xl mobile:mt-2 mobile:text-lg mt-3 text-3xl">
          تم عرضها بواسطة: {parentUser.first_name} {parentUser.last_name}
        </p>
      </div>
    );
  }

  // Parent mode (parent's own dashboard)
  if (parentUser && !child) {
    return (
      <div className="tablet:mb-10 tablet:px-8 mobile:mb-6 mobile:px-4 mb-14 ps-16">
        <h1 className="font-medad text-olive-700 tablet:text-4xl mobile:text-3xl text-6xl">
          السلام عليكم يا {parentUser.gender === "male" ? "أخ" : "أخت"}{" "}
          {parentUser.first_name}
        </h1>
        <p className="text-olive-600 tablet:text-2xl mobile:mt-2 mobile:text-lg mt-3 text-3xl">
          {subtitle || "لوحة تحكم ولي الأمر - إدارة أبنائك"}
        </p>
      </div>
    );
  }

  // Student mode
  if (user) {
    return (
      <div className="tablet:mb-10 tablet:px-8 mobile:mb-6 mobile:px-4 mb-14 ps-16">
        <h1 className="font-medad text-olive-700 tablet:text-4xl mobile:text-3xl text-6xl">
          السلام عليكم يا {user.gender === "male" ? "أخ" : "أخت"}{" "}
          {user.first_name}
        </h1>
        <p className="text-olive-600 tablet:text-2xl mobile:mt-2 mobile:text-lg mt-3 text-3xl">
          مرحباً بك في لوحة التحكم الخاصة بك
        </p>
      </div>
    );
  }

  return null;
}
