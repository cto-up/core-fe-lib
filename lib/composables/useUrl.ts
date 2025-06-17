// composables/useUrl.ts
import { ref} from 'vue'
import { type LocationQueryValue, useRouter } from 'vue-router'

export interface QueryParams {
  [key: string]: LocationQueryValue | LocationQueryValue[] | null
}

export function useUrl() {
  const router = useRouter()
  const params = ref<QueryParams>({})

// Common multi-part TLDs that need special handling
const MULTI_PART_TLDS = new Set([
  // UK domains
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk',
  // Australian domains
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au',
  // New Zealand domains
  'co.nz', 'net.nz', 'org.nz', 'edu.nz', 'govt.nz', 'ac.nz',
  // Japanese domains
  'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'ad.jp', 'ed.jp', 'go.jp',
  // Brazilian domains
  'com.br', 'net.br', 'org.br', 'edu.br', 'gov.br', 'mil.br',
  // Mexican domains
  'com.mx', 'net.mx', 'org.mx', 'edu.mx', 'gob.mx',
  // South African domains
  'co.za', 'net.za', 'org.za', 'edu.za', 'gov.za', 'ac.za',
  // Indian domains
  'co.in', 'net.in', 'org.in', 'edu.in', 'gov.in', 'ac.in',
  // Chinese domains
  'com.cn', 'net.cn', 'org.cn', 'edu.cn', 'gov.cn', 'ac.cn',
  // Singapore domains
  'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg',
  // Hong Kong domains
  'com.hk', 'net.hk', 'org.hk', 'edu.hk', 'gov.hk',
  // Taiwan domains
  'com.tw', 'net.tw', 'org.tw', 'edu.tw', 'gov.tw',
  // Korean domains
  'co.kr', 'ne.kr', 'or.kr', 'ac.kr', 'go.kr',
  // Malaysian domains
  'com.my', 'net.my', 'org.my', 'edu.my', 'gov.my',
  // Thai domains
  'co.th', 'net.th', 'org.th', 'edu.th', 'go.th', 'ac.th',
  // Philippine domains
  'com.ph', 'net.ph', 'org.ph', 'edu.ph', 'gov.ph',
  // Pakistani domains
  'com.pk', 'net.pk', 'org.pk', 'edu.pk', 'gov.pk',
  // Colombian domains
  'com.co', 'net.co', 'org.co', 'edu.co', 'gov.co',
  // European domains
  'co.de', 'com.de', 'co.fr', 'com.fr', 'co.it', 'com.it',
  'co.es', 'com.es', 'co.nl', 'com.nl', 'co.be', 'com.be',
  // Other common ones
  'com.ar', 'net.ar', 'org.ar', 'edu.ar', 'gov.ar',
  'com.pe', 'net.pe', 'org.pe', 'edu.pe', 'gob.pe',
  'com.cl', 'net.cl', 'org.cl', 'edu.cl', 'gob.cl',
  'com.ec', 'net.ec', 'org.ec', 'edu.ec', 'gov.ec'
]);

/**
 * Checks if a string is an IP address (IPv4 or IPv6)
 */
const isIPAddress = (hostname) => {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // Simple IPv6 pattern (basic check)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
};

/**
 * Extracts domain parts considering multi-part TLDs
 * @param {string} hostname - The hostname to parse
 * @returns {object} Object containing subdomain, domain, tld, and fullHost
 */
const extractDomainParts = (hostname) => {
  if (!hostname || typeof hostname !== 'string') {
    return { subdomain: '', domain: '', tld: '', fullHost: hostname || '' };
  }

  // Normalize hostname
  hostname = hostname.toLowerCase().trim();

  // Handle IP addresses
  if (isIPAddress(hostname)) {
    return { subdomain: '', domain: hostname, tld: '', fullHost: hostname };
  }

  const parts = hostname.split('.');
  const numParts = parts.length;

  // Handle edge cases
  if (numParts === 0) {
    return { subdomain: '', domain: '', tld: '', fullHost: hostname };
  }
  if (numParts === 1) {
    // Single part like "localhost"
    return { subdomain: '', domain: parts[0], tld: '', fullHost: hostname };
  }

  // Check for multi-part TLDs (e.g., co.uk, com.au)
  let tldParts = 1; // Default to single TLD part

  // Check if last two parts form a known multi-part TLD
  if (numParts >= 2) {
    const lastTwoParts = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(lastTwoParts)) {
      tldParts = 2;
    }
  }

  // Calculate domain parts based on TLD structure
  if (numParts <= tldParts) {
    // Not enough parts for a proper domain
    return { subdomain: '', domain: hostname, tld: '', fullHost: hostname };
  } else if (numParts === tldParts + 1) {
    // Just domain + TLD (e.g., "example.com" or "example.co.uk")
    const domain = parts[0];
    const tld = parts.slice(1).join('.');
    const fullDomain = `${domain}.${tld}`;
    return { subdomain: '', domain: fullDomain, tld, fullHost: hostname };
  } else {
    // Has subdomain(s)
    const domainStartIdx = numParts - tldParts - 1;
    const subdomainParts = parts.slice(0, domainStartIdx);
    const domainPart = parts[domainStartIdx];
    const tldPart = parts.slice(domainStartIdx + 1).join('.');
    const fullDomain = `${domainPart}.${tldPart}`;

    // MODIFIED: Get only the last part of the subdomain
    // Instead of joining all subdomain parts, just take the last one
    const lastSubdomainPart = subdomainParts[subdomainParts.length - 1];

    return {
      subdomain: lastSubdomainPart,
      domain: fullDomain,
      tld: tldPart,
      fullHost: hostname
    };
  }
};

/**
 * Gets comprehensive domain information from current page or provided hostname
 * @param {string} [hostname] - Optional hostname to parse (defaults to window.location.host)
 * @returns {object} Object containing all domain parts
 */
const getDomainInfo = (hostname = null) => {
  try {
    // Use provided hostname or get from current page
    const host = hostname || (typeof window !== 'undefined' ? window.location.host : '');

    // Remove port if present
    const cleanHost = host.split(':')[0];

    return extractDomainParts(cleanHost);
  } catch (error) {
    console.warn('Error parsing domain:', error);
    return { subdomain: '', domain: '', tld: '', fullHost: hostname || '' };
  }
};

  /**
   * Gets just the subdomain from current page or provided hostname
   * @param {string} [hostname] - Optional hostname to parse
   * @returns {string|null} The subdomain or null if none exists
   */
  const getSubdomain = (hostname = null) => {
    const domainInfo = getDomainInfo(hostname);

    // If there's no subdomain, return null
    if (!domainInfo.subdomain) {
      return null;
    }

    // If the subdomain contains dots, it has multiple parts
    if (domainInfo.subdomain.includes('.')) {
      // Split by dots and get the last part
      const parts = domainInfo.subdomain.split('.');
      return parts[parts.length - 1];
    }

    // Otherwise return the subdomain as is
    return domainInfo.subdomain;
  };

  const getDomain = (hostname = null) => {
    const domainInfo = getDomainInfo(hostname);
    return domainInfo.domain;
  }

  const isTenantSubdomain = () => {
     const subdomain = getSubdomain();
     return (subdomain && subdomain !== 'www')
  }

  function updateParams(newParams: QueryParams) {
    void router.push({ query: { ...params.value, ...newParams } })
  }


  // connectionId: string
  // location: string
  const socketPath = (location: string, connectionId: string) => {
    const baseSocket = process.env.HTTP_API
    return `${baseSocket}/ws/channel/${location}/connections/${connectionId}`
  }
  return { params, socketPath, updateParams, getDomain, getSubdomain, isTenantSubdomain }
}
