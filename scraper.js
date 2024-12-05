var EightyApp = function() {
    // Extracts structured data from the page HTML
 
this.processDocument = function (html, url, headers, status, jQuery) {
    const app = this;
    const $ = jQuery;
    const $html = app.parseHtml(html, $);
    const object = {};

    // Crawl date
    object.dateCrawled = app.formatDate(Date.now());

    // Title - Use find() to ensure it gets the title tag
    const title = $html.find('title').text().trim();
    object.title = title ? title : 'No Title Available';

    // Meta Tags (only description needed)
    object.meta = {
        description: $html.find('meta[name="description"]').attr('content') || 'No Description Available'
    };

    // Clean Lossy HTML
    let cleanedHTML = html
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[\s\S]*?>/g, '') // Remove HTML tags
        .replace(/[\t\n\r]+/g, ' ') // Remove newlines/tabs
        .trim();
    object.lossyHTML = cleanedHTML;



    // Links - Improve link text extraction and remove unnecessary ones
    const links = [];
    $html.find('a').each(function () {
        const link = app.makeLink(url, $(this).attr('href'));
        const linkText = $(this).text().trim();
        if (link && linkText && linkText !== 'No Text') {
            links.push({ text: linkText || 'No Text', url: link });
        }
    });

    // Deduplicate Links
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
