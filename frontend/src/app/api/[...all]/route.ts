import { auth } from "@/lib/auth"; // Adjust import path if necessary
import { toNodeHandler } from "better-auth/node";

const handler = toNodeHandler(auth);

export { handler as GET, handler as POST };
