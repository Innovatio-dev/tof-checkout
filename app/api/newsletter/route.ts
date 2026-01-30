
import { NextRequest, NextResponse } from "next/server";

import { createNewsletterSubscriber, isNewsletterConfigured } from "@/lib/newsletter";

type NewsletterRequestBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

export async function POST(request: NextRequest) {
  if (!isNewsletterConfigured()) {
    return NextResponse.json({ error: "Newsletter is not configured." }, { status: 500 });
  }

  const { email, firstName, lastName } = (await request.json()) as NewsletterRequestBody;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const subscriber = await createNewsletterSubscriber({
    email,
    first_name: firstName ?? "",
    last_name: lastName ?? "",
    country: "",
    region: "",
    city: "",
    list_N: 1,
    status: "confirmed",
  });

  return NextResponse.json(subscriber);
}
