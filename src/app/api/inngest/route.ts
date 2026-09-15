import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { handleInstagramComment } from "@/inngest/functions/handle-instagram-comment";
import { handleWhatsAppMessage } from "@/inngest/functions/handle-whatsapp-message";
import { handleInstagramPostback } from "@/inngest/functions/handle-instagram-postback";
import { handleInstagramMedia } from "@/inngest/functions/handle-instagram-media";
import { cleanupLogsCron } from "@/inngest/functions/cleanup-logs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handleInstagramComment,
    handleWhatsAppMessage,
    handleInstagramPostback,
    handleInstagramMedia,
    cleanupLogsCron,
  ],
});
