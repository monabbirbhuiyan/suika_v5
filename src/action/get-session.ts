"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});
