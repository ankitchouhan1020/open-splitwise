import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function PeopleRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.view === "groups") redirect("/?tab=groups");
  redirect("/?tab=people");
}
