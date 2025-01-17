export const scrapePumpFunDetails = async (userInputUrl) => {
    const proxyUrl = "https://api.allorigins.win/get?url="; // Use proxy to bypass CORS
    const fullUrl = `${proxyUrl}${encodeURIComponent(userInputUrl)}`

    try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch data.");

        const data = await response.json();
        const htmlContent = data.contents;

        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Extract specific fields
        const name = doc.querySelector("meta[property='og:title']")?.getAttribute("content") || null;

        // Extract and clean Market Cap
        const marketCapElement = Array.from(doc.querySelectorAll("div")).find((div) =>
            div.textContent.includes("market cap:")
        );
        const marketCap = marketCapElement
            ? parseInt(
                Number(marketCapElement.textContent.match(/market cap:\s*\$([\d,]+)/i)?.[1].replace(/,/g, "")) || "0",
                10
            )
            : 0;

        // Extract and clean Review Count
        const reviewCountElement = Array.from(doc.querySelectorAll("div")).find((div) =>
            div.textContent.includes("replies:")
        );
        const reviewCount = reviewCountElement
            ? parseInt(
                Number(reviewCountElement.textContent.match(/replies:\s*([\d,]+)/i)?.[1].replace(/,/g, "")) || "0",
                10
            )
            : 0;

        const scrpData = {
            name,
            marketCap,
            reviewCount,
        };

        //console.log("Extracted Data:", scrpData); // Log the results to console
        return scrpData;
    } catch (error) {
        console.error("Error scraping PumpFun details:", error);
        throw error;
    }
};