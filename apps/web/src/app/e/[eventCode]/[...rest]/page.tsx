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

  if (tab === "photobook") {
    // If the router falls into the catch-all for photobook, bounce back to the valid path
    redirect(`/e/${eventCode}/photobook`);
  }
  
  redirect(`/e/${eventCode}`);
}
