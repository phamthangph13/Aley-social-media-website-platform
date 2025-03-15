/**
 * hashtag-formatter.js - Handles hashtag formatting for Aley social media
 * Provides utility functions for highlighting hashtags in post content
 */

// Function to format text with colored hashtags
function formatTextWithHashtags(text) {
    if (!text) return '';
    
    // HTML encode the text to prevent issues
    const encodedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Replace hashtags with colored spans
    // This regex matches hashtags that are:
    // - Preceded by a space or at beginning of text
    // - Include letters, numbers, Vietnamese chars, and underscores
    // - Continue until a space, punctuation, or end of string
    let formattedText = encodedText.replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, function(match, p1, p2) {
        const color = getHashtagColor(p2);
        return p1 + `<span class="hashtag" style="color: ${color};">${p2}</span>`;
    });
    
    return formattedText;
}

// Function to generate a consistent color for each hashtag
function getHashtagColor(hashtag) {
    // List of vibrant colors for hashtags
    const colors = [
        '#E53935', // Red
        '#8E24AA', // Purple
        '#1E88E5', // Blue
        '#43A047', // Green
        '#FFB300', // Amber
        '#FB8C00', // Orange
        '#00ACC1', // Cyan
        '#3949AB', // Indigo
        '#D81B60', // Pink
        '#00897B'  // Teal
    ];
    
    // Generate a hash code for the hashtag to get a consistent color
    let hashCode = 0;
    for (let i = 0; i < hashtag.length; i++) {
        hashCode = (hashtag.charCodeAt(i) + ((hashCode << 5) - hashCode)) & 0xFFFFFFFF;
    }
    
    // Use modulo to get an index in the colors array
    const colorIndex = Math.abs(hashCode) % colors.length;
    return colors[colorIndex];
}

// Export the functions to be used by other scripts
window.hashtagFormatter = {
    formatTextWithHashtags,
    getHashtagColor
}; 