/**
 * Handler for searching website JavaScript content
 * Allows querying JavaScript code using regex patterns
 */

/**
 * Search for JavaScript content using regex patterns
 * @param {string} regex - Regular expression pattern to search for
 * @param {number} maxMatches - Maximum number of matches to return
 * @param {number} contextLines - Number of lines around each match to include
 * @returns {Object} Search results
 */
async function searchWebsiteJavaScript(regex, maxMatches = 10, contextLines = 100) {
  try {
    // Validate regex
    if (!regex || typeof regex !== "string") {
      throw new Error("Valid regular expression pattern is required");
    }

    // Validate regex pattern
    let regexObj;
    try {
      regexObj = new RegExp(regex, "g");
    } catch (error) {
      throw new Error(`Invalid regular expression: ${error.message}`);
    }

    const matches = [];
    let totalFound = 0;

    // Search in inline scripts
    const scriptTags = document.querySelectorAll("script");

    scriptTags.forEach((script, scriptIndex) => {
      const scriptContent = script.textContent || script.innerHTML || "";
      if (!scriptContent.trim()) return;

      const lines = scriptContent.split('\n');
      let matchCount = 0;

      lines.forEach((line, lineIndex) => {
        const lineMatches = [...line.matchAll(regexObj)];

        lineMatches.forEach((match) => {
          totalFound++;

          if (matchCount >= maxMatches) return;

          // Calculate context range
          const startLine = Math.max(0, lineIndex - Math.floor(contextLines / 2));
          const endLine = Math.min(lines.length - 1, lineIndex + Math.floor(contextLines / 2));

          // Extract context lines
          const context = lines.slice(startLine, endLine + 1).join('\n');

          matches.push({
            index: matchCount,
            scriptIndex: scriptIndex,
            lineNumber: lineIndex + 1,
            match: match[0],
            fullLine: line.trim(),
            context: context,
            scriptType: script.type || 'text/javascript',
            scriptSrc: script.src || null,
            matchIndex: match.index,
            isExternal: false,
          });

          matchCount++;
        });
      });
    });

    // Search in external script content
    const externalScripts = Array.from(scriptTags).filter(script => script.src);

    // Fetch and search external scripts
    for (const script of externalScripts) {
      try {
        const response = await fetch(script.src);
        if (!response.ok) {
          console.warn(`Failed to fetch external script: ${script.src}`);
          continue;
        }

        const scriptContent = await response.text();
        if (!scriptContent.trim()) continue;

        const lines = scriptContent.split('\n');
        let matchCount = 0;

        lines.forEach((line, lineIndex) => {
          const lineMatches = [...line.matchAll(regexObj)];

          lineMatches.forEach((match) => {
            totalFound++;

            if (matchCount >= maxMatches) return;

            // Calculate context range
            const startLine = Math.max(0, lineIndex - Math.floor(contextLines / 2));
            const endLine = Math.min(lines.length - 1, lineIndex + Math.floor(contextLines / 2));

            // Extract context lines
            const context = lines.slice(startLine, endLine + 1).join('\n');

            matches.push({
              index: matchCount,
              scriptIndex: scriptIndex,
              lineNumber: lineIndex + 1,
              match: match[0],
              fullLine: line.trim(),
              context: context,
              scriptType: script.type || 'text/javascript',
              scriptSrc: script.src,
              matchIndex: match.index,
              isExternal: true,
            });

            matchCount++;
          });
        });
      } catch (error) {
        console.warn(`Error fetching external script ${script.src}:`, error);
        // Continue with other scripts even if one fails
      }
    }

    return {
      success: true,
      regex: regex,
      totalFound: totalFound,
      returned: Math.min(matches.length, maxMatches),
      matches: matches.slice(0, maxMatches),
      pageInfo: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        scriptCount: scriptTags.length,
        externalScriptCount: externalScripts.length,
      },
    };
  } catch (error) {
    console.error("Error searching website JavaScript:", error);
    return {
      success: false,
      error: error.message,
      regex: regex,
    };
  }
}

/**
 * Handle SEARCH_WEBSITE_JAVASCRIPT message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
async function handleSearchWebsiteJavaScript(request, sender, sendResponse) {
  console.log("handleSearchWebsiteJavaScript called with:", request);

  try {
    // Validate input
    if (!request || !request.regex) {
      console.error("Invalid request - missing regex pattern");
      sendResponse({
        success: false,
        error: "Missing regex pattern in request",
      });
      return;
    }

    console.log("Searching JavaScript with regex:", request.regex);
    const result = await searchWebsiteJavaScript(
      request.regex,
      request.maxMatches || 10,
      request.contextLines || 100
    );
    console.log("JavaScript search result:", result);

    sendResponse(result);
  } catch (error) {
    console.error("Error in handleSearchWebsiteJavaScript:", error);
    console.error("Error stack:", error.stack);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
} 