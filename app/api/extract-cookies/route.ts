import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let parsedURL: URL;
    try {
      parsedURL = new URL(url);
      if(!["http:", "https:"].includes(parsedURL.protocol)) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(parsedURL.href, { waitUntil: "networkidle", timeout: 70000 });

      await page.waitForTimeout(2000);

      const cookieBannerSelectors = [
        'button:has-text("Accept All")',
        'button:has-text("Accept Cookies")',
        'button:has-text("Accept")',
        'button:has-text("Agree")',
      ];

      const button = await (async () => {
        for (const bannerSelector of cookieBannerSelectors) {
          const candidateButton = await page.$(bannerSelector);
          if (candidateButton) {
            return candidateButton;
          }
        }
        return null;
      })();

      if (button) {
        await button.click();
        await page.waitForTimeout(1000);
      }
    
      const cookies = await context.cookies();

      const cookiesCollection = cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ? cookie.expires * 1000 : "session",
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      }));

      await browser.close();

      return NextResponse.json({ cookies: cookiesCollection, url: parsedURL.href });
    } catch (error) {
        if(browser) await browser.close().catch(() => {});
        return NextResponse.json({ error: "Failed to fetch cookies" }, { status: 500 });
    }
}