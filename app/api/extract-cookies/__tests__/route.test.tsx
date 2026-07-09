import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";
import { chromium } from "playwright";

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

describe("POST /api/extract-cookies", () => {
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;
  let mockRequest: any;

  beforeEach(() => {
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      cookies: vi.fn().mockResolvedValue([]),
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Test Input Validation", () => {
    it("test to see if 400 error returns when URL is missing", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns when URL is not a string", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: 12345 }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns when URL is null", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: null }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns for invalid URL format", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "not a valid url" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns for FTP protocol", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "ftp://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns for file protocol", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "file:///path/to/file" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });

    it("test to see if 400 error returns for custom protocol", async () => {
      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "custom://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid URL" });
    });
  });

  describe("Successful Cookie Extraction", () => {
    it("test to see if cookies are extracted from a valid HTTP URL", async () => {
      const mockCookies = [
        {
          name: "session_id",
          value: "abc123",
          domain: "example.com",
          path: "/",
          expires: 1700000000,
          secure: true,
          httpOnly: true,
          sameSite: "Strict" as const,
        },
      ];

      mockContext.cookies.mockResolvedValue(mockCookies);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "http://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("http://example.com/");
      expect(data.cookies).toEqual([
        {
          name: "session_id",
          value: "abc123",
          domain: "example.com",
          path: "/",
          expires: 1700000000000,
          secure: true,
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
    });

    it("test to see if cookies are extracted from a valid HTTPS URL", async () => {
      const mockCookies = [
        {
          name: "token",
          value: "xyz789",
          domain: "secure.example.com",
          path: "/api",
          expires: null,
          secure: true,
          httpOnly: false,
          sameSite: "Lax" as const,
        },
      ];

      mockContext.cookies.mockResolvedValue(mockCookies);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://secure.example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("https://secure.example.com/");
      expect(data.cookies).toEqual([
        {
          name: "token",
          value: "xyz789",
          domain: "secure.example.com",
          path: "/api",
          expires: "session",
          secure: true,
          httpOnly: false,
          sameSite: "Lax",
        },
      ]);
    });

    it("test to see if URLs with paths and query parameters are handled correctly", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com/path/to/page?foo=bar&baz=qux",
        }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("https://example.com/path/to/page?foo=bar&baz=qux");
      expect(data.cookies).toEqual([]);
    });

    it("test to see if multiple cookies are handled correctly", async () => {
      const mockCookies = [
        {
          name: "cookie1",
          value: "value1",
          domain: "example.com",
          path: "/",
          expires: 1700000000,
          secure: true,
          httpOnly: true,
          sameSite: "Strict" as const,
        },
        {
          name: "cookie2",
          value: "value2",
          domain: "example.com",
          path: "/",
          expires: null,
          secure: false,
          httpOnly: false,
          sameSite: "None" as const,
        },
        {
          name: "cookie3",
          value: "value3",
          domain: "example.com",
          path: "/sub",
          expires: 1800000000,
          secure: true,
          httpOnly: false,
          sameSite: "Lax" as const,
        },
      ];

      mockContext.cookies.mockResolvedValue(mockCookies);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cookies).toHaveLength(3);
      expect(data.cookies[0].expires).toBe(1700000000000);
      expect(data.cookies[1].expires).toBe("session");
      expect(data.cookies[2].expires).toBe(1800000000000);
    });

    it("test to see if no cookies response is handled correctly", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cookies).toEqual([]);
    });
  });

  describe("Browser and Navigation", () => {
    it("test to see if browser launches with headless mode", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      await POST(mockRequest);

      expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
    });

    it("test to see if navigation to the provided URL works correctly", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/page" }),
      });

      await POST(mockRequest);

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com/page", {
        waitUntil: "networkidle",
        timeout: 70000,
      });
    });

    it("test to see if timeout is waited for after navigation", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      await POST(mockRequest);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it("test to see if browser is closed after successful extraction", async () => {
      mockContext.cookies.mockResolvedValue([]);

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      await POST(mockRequest);

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("test to see if 500 error is returned when browser launch fails", async () => {
      vi.mocked(chromium.launch).mockRejectedValue(
        new Error("Failed to launch browser")
      );

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch cookies" });
    });

    it("test to see if 500 error is returned when navigation fails", async () => {
      mockPage.goto.mockRejectedValue(new Error("Navigation timeout"));

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch cookies" });
    });

    it("test to see if 500 error is returned when context.cookies() fails", async () => {
      mockContext.cookies.mockRejectedValue(new Error("Cookie extraction failed"));

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch cookies" });
    });

    it("test to see if browser is closed even if cookie extraction fails", async () => {
      mockContext.cookies.mockRejectedValue(new Error("Cookie extraction failed"));

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      await POST(mockRequest);

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("test to see if browser.close() errors are handled gracefully", async () => {
      mockContext.cookies.mockRejectedValue(new Error("Cookie extraction failed"));
      mockBrowser.close.mockRejectedValue(new Error("Close failed"));

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch cookies" });
    });

    it("test to see if 500 error is returned when waitForTimeout fails", async () => {
      mockPage.waitForTimeout.mockRejectedValue(new Error("Timeout error"));

      mockRequest = new NextRequest("http://localhost/api/extract-cookies", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch cookies" });
    });
  });
});
