import { Inngest } from "inngest";
import dotenv from "dotenv";

dotenv.config();

const inngest = new Inngest({ id: "salty-auto", eventKey: process.env.INNGEST_EVENT_KEY });

async function run() {
  console.log("Sending event to Inngest with key:", process.env.INNGEST_EVENT_KEY);
  const result = await inngest.send({
    name: "meta/instagram.comment",
    data: {
      accountId: "17841466896922373", // strangermingle
      commentId: "test_comment_" + Date.now(),
      mediaId: "18085649999309895", // The specific post
      fromId: "test_user_123",
      fromUsername: "test_tester",
      text: "MEETUP",
      timestamp: Date.now(),
    },
  });
  console.log("Inngest send result:", result);
}

run().catch(console.error);
