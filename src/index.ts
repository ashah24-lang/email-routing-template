/**
 * CREW email ingestion pilot.
 * Inbound-only: does not forward mail, invoke downstream services, or persist body.
 * Non-test mail is silently discarded pending a separately reviewed production policy.
 */
export async function handleEmail(
  message: ForwardableEmailMessage,
  env: Env,
): Promise<void> {
  const route = env.ROUTE_ADDRESS.trim().toLowerCase();
  if (!route || message.to.trim().toLowerCase() !== route) {
    message.setReject("Unknown recipient");
    return;
  }

  const subject = (message.headers.get("subject") ?? "").trim();
  if (!/^CREW-TEST(?:\b|:)/i.test(subject)) {
    // Safe pilot: accept and discard non-test mail. No downstream action.
    return;
  }

  const senderDomain = message.from.trim().toLowerCase().split("@").pop() ?? "";
  const messageId = message.headers.get("message-id") ?? "(missing)";
  console.log(
    "crew-email-test-received",
    JSON.stringify({
      recipient: route,
      senderDomain,
      messageId,
      rawSize: message.rawSize,
    }),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/health") {
      return new Response("Not found", { status: 404 });
    }
    return Response.json({
      service: "crew-email-trigger",
      state: "test-only",
      routeConfigured: Boolean(env.ROUTE_ADDRESS?.trim()),
    });
  },
  email: handleEmail,
} satisfies ExportedHandler<Env>;
