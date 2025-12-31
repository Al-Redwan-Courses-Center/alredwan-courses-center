export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="content-center py-150 text-center text-8xl font-bold">
      Course {id}
    </div>
  );
}
