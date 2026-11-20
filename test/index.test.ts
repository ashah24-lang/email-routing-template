import { SELF } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { handleEmail } from "../src/index";

function createMessage(
  overrides: { from?: string; to?: string; subject?: string } = {},
) {
  const setReject = vi.fn<ForwardableEmailMessage["setReject"]>();
  const forward = vi.fn<ForwardableEmailMessage["forward"]>();
  const headers = new Headers({
    subject: overrides.subject ?? "CREW-TEST: test delivery",
    "message-id": "<test-message-001@example.test>",
  });
  const message = {
    from: overrides.from ?? "tester@example.test",
    to: overrides.to ?? "alerts@crew-ops.dev",
    headers,
    rawSize: 512,
    setReject,
    forward,
  } as unknown as ForwardableEmailMessage;
  return { message, setReject, forward };
}

const env = { ROUTE_ADDRESS: "alerts@crew-ops.dev" } as Env;

describe("CREW Email Worker test-only", () => {
  it("responds to health checks without exposing configuration values", async () => {
    const response = await SELF.fetch("https://example.com/health");
    expect(response.status).toBe(200);
    const payload = await response.json() as Record<string, unknown>;
    expect(payload.state).toBe("test-only");
    expect(payload.routeConfigured).toBe(true);
  });

  it("rejects unexpected recipients", async () => {
    const { message, setReject, forward } = createMessage({ to: "someone@crew-ops.dev" });
    await handleEmail(message, env);
    expect(setReject).toHaveBeenCalledOnce();
    expect(forward).not.toHaveBeenCalled();
  });

  it("logs test metadata without forwarding or message body", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const { message, setReject, forward } = createMessage();
      await handleEmail(message, env);
      expect(setReject).not.toHaveBeenCalled();
      expect(forward).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledOnce();
      const [event, payload] = log.mock.calls[0];
      expect(event).toBe("crew-email-test-received");
      const data = JSON.parse(String(payload));
      expect(data.recipient).toBe("alerts@crew-ops.dev");
      expect(data.senderDomain).toBe("example.test");
      expect(data.messageId).toBe("<test-message-001@example.test>");
      expect(JSON.stringify(data)).not.toContain("CREW-TEST");
      expect(JSON.stringify(data)).not.toContain("tester@");
    } finally {
      log.mockRestore();
    }
  });

  it("discards non-test mail without forwarding", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const { message, setReject, forward } = createMessage({ subject: "Real operational alert" });
      await handleEmail(message, env);
      expect(setReject).not.toHaveBeenCalled();
      expect(forward).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it("does not expose an HTTP ingestion route", async () => {
    const response = await SELF.fetch("https://example.com/ingest");
    expect(response.status).toBe(404);
  });
});
