import { getBrowser } from "./browser.service.js";

export async function scrapeWebpage(url) {
  if (!url) {
    throw new Error("URL is required.");
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const data = await page.evaluate(() => {
      const internalLinks = [];
      const externalLinks = [];

      document.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");

        if (!href) return;
        if (href.startsWith("#")) return;
        if (href.startsWith("mailto:")) return;
        if (href.startsWith("tel:")) return;

        if (href.startsWith("http://") || href.startsWith("https://")) {
          externalLinks.push(href);
        } else {
          internalLinks.push(href);
        }
      });

      return {
        metadata: {
          title: document.title,
          description:
            document
              .querySelector('meta[name="description"]')
              ?.getAttribute("content") || "",
        },

        content: {
          head: document.head.innerHTML,
          body: document.body.innerText,
        },

        links: {
          internalLinks,
          externalLinks,
        },
      };
    });

    // Remove duplicate links
    data.links.internalLinks = [...new Set(data.links.internalLinks)];
    data.links.externalLinks = [...new Set(data.links.externalLinks)];

    return data;
  } finally {
    await page.close();
  }
}