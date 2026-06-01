import { redirect } from "next/navigation";

export default async function EventRedirectPage({
  params
}: {
  params: Promise<{ eventCode: string; rest: string[] }>;
}) {
  const { eventCode, rest } = await params;
  
  const tab = rest[0];
  if (tab === "gallery" || tab === "camera") {
    redirect(`/e/${eventCode}?tab=${tab}`);
  }
  
  redirect(`/e/${eventCode}`);
}
