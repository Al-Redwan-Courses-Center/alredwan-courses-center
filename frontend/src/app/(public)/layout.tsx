import NavBar from "@/components/nav/NavBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[auto_1fr]">
      <NavBar />
      {children}
    </div>
  );
}
