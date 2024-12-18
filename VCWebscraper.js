var EightyApp = function() {
    // Extracts structured data from the page HTML
    this.processDocument = function (html, url, headers, status, jQuery) {
        const app = this;
        const $ = jQuery;
        const $html = app.parseHtml(html, $);
        const object = {};

        // Track the original input URL and the final redirected URL
        object.inputUrl = url;
        object.finalUrl = headers['Location'] || url;

        // Crawl date
        object.dateCrawled = app.formatDate(Date.now());

        // Extract the title from the page
        object.title = $html.find('title').text().trim() || 'No Title Available';

        // Extract meta description tag
        object.meta = {
            description: $html.find('meta[name="description"]').attr('content') || 'No Description Available'
        };

        // Generate lossyHTML by cleaning up the raw HTML content
        object.lossyHTML = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        // Extract relevant links
        const links = [];
        $html.find('a').each(function () {
            const link = app.makeLink(url, $(this).attr('href'));
            const linkText = $(this).text().trim();

            const relevantUrlPatterns = /(about|team|people|portfolio|investment|investments|companies|company|focus|approach|strategy|thesis|contact|office)/i;
            const socialMediaPatterns = /(linkedin\.com|twitter\.com|facebook\.com|instagram\.com|youtube\.com)/i;

            if (link && (relevantUrlPatterns.test(link) || socialMediaPatterns.test(link))) {
                links.push({ text: linkText || 'No Text', url: link });
            }
        });

        object.links = links.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

        return JSON.stringify(object);
    };

    // Crawls all internal links with updated filters
    this.parseLinks = function(html, url, headers, status, jQuery) {
        const app = this;
        const $ = jQuery;
        const $html = app.parseHtml(html, $);
        const linksSet = new Set();

        // Define filters
        const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/;
        const keywordFilter = ["about", "team", "people", "portfolio", "investment", "investments", "companies", "company", "focus", "approach", "strategy", "thesis", "contact", "office"];

        const isRelevantLink = (link) => keywordFilter.some(keyword => link.toLowerCase().includes(keyword));
        const isInternalLink = (baseUrl, link) => {
            const domainPattern = /:\/\/(.[^/]+)/;
            const baseDomain = baseUrl.match(domainPattern)[1].toLowerCase();
            const linkDomain = link.match(domainPattern);
            return linkDomain && linkDomain[1].toLowerCase() === baseDomain;
        };

        $html.find("a").each(function() {
            const link = app.makeLink(url, $(this).attr("href"));
            if (link && urlPattern.test(link) && isInternalLink(url, link) && isRelevantLink(link)) {
                linksSet.add(link);
            }
        });

        return Array.from(linksSet);
    };
};

module.exports = function(EightyAppBase) {
    EightyApp.prototype = new EightyAppBase();
    return new EightyApp();
};
