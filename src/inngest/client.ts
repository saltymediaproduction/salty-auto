import { Inngest, EventSchemas } from "inngest";

// Type definitions for all background events dispatched by webhooks
export type Events = {
  "meta/instagram.comment": {
    data: {
      accountId: string; // Instagram Business Account ID
      commentId: string; // Unique Meta Comment ID
      mediaId: string; // Post or Reel ID
      fromId: string; // Commenter IGSID
      fromUsername: string; // Commenter handle
      text: string; // The comment text
      timestamp: number;
    };
  };
  "meta/whatsapp.message": {
    data: {
      phoneNumberId: string;
      messageId: string;
      from: string; // E.164 phone number
      profileName?: string;
      text: string;
      timestamp: number;
    };
  };
};

export const inngest = new Inngest({
  id: "salty-auto",
  schemas: new EventSchemas().fromRecord<Events>(),
});
