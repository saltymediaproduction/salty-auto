import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { handleInstagramComment } from "@/inngest/functions/handle-instagram-comment";
import { handleWhatsAppMessage } from "@/inngest/functions/handle-whatsapp-message";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handleInstagramComment,
    handleWhatsAppMessage,
  ],
});
