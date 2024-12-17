var EightyApp = function() {
    // Extracts structured data from the page HTML
 
 
this.processDocument = function (html, url, headers, status, jQuery) {
    const app = this;
    const $ = jQuery;
    const $html = app.parseHtml(html, $);
    const object = {};

    // Track the original input URL and the final redirected URL
    object.inputUrl = url; // Original input URL
    object.finalUrl = headers['Location'] || url; // Redirected URL or original URL if no redirection

    // Crawl date
    object.dateCrawled = app.formatDate(Date.now());

    // Extract the title from the page
    const title = $html.find('title').text().trim();
    object.title = title || 'No Title Available';

    // Extract meta description tag
    object.meta = {
        description: $html.find('meta[name="description"]').attr('content') || 'No Description Available'
    };

    // Generate lossyHTML by cleaning up the raw HTML content
    let cleanedHTML = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')  // Remove script tags and content
    .replace(/<style[\s\S]*?<\/style>/gi, '')  // Remove style tags and content
    .replace(/<!--[\s\S]*?-->/g, '')  // Remove comments
    .replace(/<[^>]+>/g, ' ')  // Replace HTML tags with spaces
    .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
    .replace(/^\s+|\s+$/g, '')  // Trim leading and trailing spaces
    .replace(/\s+/g, ' ')  // Replace multiple spaces or newlines with a single space
    .trim();  // Final cleanup to ensure no trailing spaces

    object.lossyHTML = cleanedHTML;


    // Extract relevant links (internal pages and social media)
    const links = [];
    $html.find('a').each(function () {
        const link = app.makeLink(url, $(this).attr('href')); // Resolve relative links
        const linkText = $(this).text().trim(); // Get the link text

        // Patterns for relevant URLs and social media
        const relevantUrlPatterns = /(about|team|portfolio|investments|companies|news)/i;
        const socialMediaPatterns = /(linkedin\.com|twitter\.com|facebook\.com|instagram\.com|youtube\.com)/i;

        // Check if the link matches relevant patterns or is a social media link
        if (
            link &&
            (relevantUrlPatterns.test(link) || socialMediaPatterns.test(link))
        ) {
            links.push({ text: linkText || 'No Text', url: link });
        }
    });

    // Deduplicate links to avoid repetitions
    object.links = links.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

    return JSON.stringify(object);
};



 
 
 

    // Crawls all internal links with filters (no changes here)
    this.parseLinks = function(html, url, headers, status, jQuery) {
        var app = this;
        var $ = jQuery;
        var $html = app.parseHtml(html, $);
        var linksSet = new Set(); // Use Set to avoid duplicates

        // Define filters
        var urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/;
        var keywordFilter = ["team", "portfolio", "about", "investments"];

        const isRelevantLink = (link) => {
            return keywordFilter.some((keyword) => link.toLowerCase().includes(keyword));
        };

        const isInternalLink = (baseUrl, link) => {
            var domainPattern = /:\/\/(.[^/]+)/;
            var baseDomain = baseUrl.match(domainPattern)[1].toLowerCase();
            var linkDomain = link.match(domainPattern);
            return linkDomain && linkDomain[1].toLowerCase() === baseDomain;
        };

        $html.find("a").each(function() {
            var link = app.makeLink(url, $(this).attr("href"));
            if (link && urlPattern.test(link) && isInternalLink(url, link) && isRelevantLink(link)) {
                linksSet.add(link); // Add to Set
            }
        });

        return Array.from(linksSet); // Convert Set to Array
    };
};

module.exports = function(EightyAppBase) {
    EightyApp.prototype = new EightyAppBase();
    return new EightyApp();
};
