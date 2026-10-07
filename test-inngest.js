const { Inngest } = require("inngest");
require("dotenv").config({ path: ".env.local" }); // or .env if dotenv is installed, but the project might not have dotenv installed. We can just pass the key directly.
const inngest = new Inngest({ id: "salty-auto", eventKey: "HcYjE5r9GJfW23FBvTW6IzPp5NP7u8on2M_yXqy9Jpr31c_zzxztNzI03NR9NmJeLjcPPdbhz0JDMXO7-3S7eg" });

async function run() {
  console.log("Sending event to Inngest...");
  try {
    const result = await inngest.send({
      name: "meta/instagram.comment",
      data: {
        accountId: "17841466896922373", 
        commentId: "test_comment_" + Date.now(),
        mediaId: "18085649999309895",
        fromId: "test_user_123",
        fromUsername: "test_tester",
        text: "MEETUP",
        timestamp: Date.now(),
      },
    });
    console.log("Inngest send result:", result);
  } catch (err) {
    console.error("Inngest send error:", err);
  }
}

run();
