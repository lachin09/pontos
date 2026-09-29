import { notFound } from "next/navigation";

/** Any storefront URL that matches no page renders the localized 404. */
export default function UnknownPage() {
  notFound();
}
