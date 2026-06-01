import Link from "next/link";

type SidebarLinkProps = {
  href: string;
  label: string;
};

export function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
    >
      {label}
    </Link>
  );
}
