import Link from "next/link";

type SidebarLinkProps = {
  href: string;
  label: string;
};

export function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="
        block rounded-lg px-4 py-3
        text-sm font-medium text-gray-700
        transition
        hover:bg-black
        hover:text-white
      "
    >
      {label}
    </Link>
  );
}
