import { exploreGroupHref } from "@/lib/expenses/filters";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params;
  const groupId = Number(id);
  if (Number.isFinite(groupId) && groupId > 0) {
    redirect(exploreGroupHref(groupId));
  }
  redirect("/");
}
