import { useRouter } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <div className="bg-olive-100/50 border-olive-200 mb-8 border-b px-16 py-6 sm:px-4 md:px-8">
      <div className="flex items-center gap-3 text-2xl sm:text-lg">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.href ? (
              <button
                onClick={() => router.push(item.href!)}
                className="text-olive-600 hover:text-olive-700 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-olive-700 font-bold">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span className="text-olive-400">/</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
