import { handlers } from "@/lib/auth";

// Auth.js runs on the Node runtime (needs crypto). Default runtime = node.
export const { GET, POST } = handlers;
