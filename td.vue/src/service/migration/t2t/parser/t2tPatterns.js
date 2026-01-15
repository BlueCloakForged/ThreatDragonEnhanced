/**
 * T2T Extraction Patterns
 * Regex patterns for extracting entities from OTP documents
 *
 * Based on real OTP format analysis from sample_mission.txt
 */

/**
 * Regex patterns for entity extraction
 */
export const T2TPatterns = {
    /**
     * Node extraction patterns
     * Matches formats like:
     * - "Kali-01 | Kali Linux 2024.1 | x64 | 192.168.100.10 | Attacker | ssh, metasploit"
     * - "NodeName (IP.ADD.RE.SS)"
     */
    nodePatterns: {
        // Markdown table row format
        tableRow: /\|\s*([A-Za-z0-9_-]+)\s*\|[^|]*\|[^|]*\|\s*([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s*\|\s*([A-Za-z]+)\s*\|\s*([^|]+)\s*\|/g,

        // Inline format: NodeName (192.168.1.1)
        inline: /\b([A-Za-z][A-Za-z0-9_-]+)\s*\(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\)/g,

        // Common system names
        systemNames: /\b(Kali|Ubuntu|Windows|Server|Router|Firewall|pfSense|VyOS|DC-\d+|WS-\d+|WebSrv|FW-\d+)[A-Za-z0-9_-]*/gi
    },

    /**
     * IP address pattern
     */
    ipPattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,

    /**
     * Service detection patterns
     */
    servicePatterns: {
        web: /\b(HTTP|HTTPS|Apache|Nginx|IIS|port\s*80|port\s*443|web\s*server)\b/gi,
        database: /\b(MySQL|PostgreSQL|MongoDB|MSSQL|Oracle|port\s*3306|port\s*5432|port\s*1433|database|db)\b/gi,
        ssh: /\b(SSH|port\s*22|openssh)\b/gi,
        rdp: /\b(RDP|remote\s*desktop|port\s*3389)\b/gi,
        smb: /\b(SMB|CIFS|file\s*sharing|port\s*445)\b/gi,
        dns: /\b(DNS|port\s*53|name\s*resolution)\b/gi,
        ldap: /\b(LDAP|Active\s*Directory|AD|port\s*389)\b/gi,
        metasploit: /\b(metasploit|msfconsole|meterpreter)\b/gi,
        burpsuite: /\b(burp|burpsuite)\b/gi
    },

    /**
     * Connection/Flow patterns
     * Matches formats like:
     * - "Kali-01 → WebSrv-01"
     * - "from Kali-01 to WebSrv-01"
     * - "pivot through Router-02"
     */
    connectionPatterns: [
        // Arrow notation
        /([A-Za-z0-9_-]+)\s*(?:→|->|–>|=>)\s*([A-Za-z0-9_-]+)/g,

        // "from X to Y"
        /from\s+([A-Za-z0-9_-]+)\s+to\s+([A-Za-z0-9_-]+)/gi,

        // "X connects to Y"
        /([A-Za-z0-9_-]+)\s+(?:connects?|connected)\s+(?:to|with)\s+([A-Za-z0-9_-]+)/gi,

        // "pivot through X"
        /pivot\s+(?:through|via|to)\s+([A-Za-z0-9_-]+)/gi,

        // "access X"
        /access\s+(?:the\s+)?([A-Za-z0-9_-]+)/gi,

        // "target X"
        /target(?:ing|s|ed)?\s+(?:the\s+)?([A-Za-z0-9_-]+)/gi
    ],

    /**
     * Protocol detection patterns
     */
    protocolPatterns: {
        https: /\b(HTTPS|TLS|SSL|port\s*443)\b/gi,
        http: /\b(HTTP(?!S)|port\s*80)\b/gi,
        ssh: /\b(SSH|port\s*22)\b/gi,
        rdp: /\b(RDP|port\s*3389)\b/gi,
        mysql: /\b(MySQL|port\s*3306)\b/gi,
        postgresql: /\b(PostgreSQL|port\s*5432)\b/gi,
        smb: /\b(SMB|port\s*445)\b/gi,
        ldap: /\b(LDAP|port\s*389)\b/gi,
        dns: /\b(DNS|port\s*53)\b/gi
    },

    /**
     * Role/Type classification patterns
     */
    rolePatterns: {
        attacker: /\b(attacker|red\s*team|offensive|kali|penetration|pentest)\b/gi,
        server: /\b(server|srv|host)\b/gi,
        workstation: /\b(workstation|ws|client|desktop|laptop)\b/gi,
        router: /\b(router|gateway|vyos|cisco)\b/gi,
        firewall: /\b(firewall|fw|pfsense|fortinet)\b/gi,
        database: /\b(database|db|mysql|postgresql|mongo)\b/gi,
        domainController: /\b(domain\s*controller|dc|active\s*directory|ad)\b/gi
    },

    /**
     * Enclave/Network segment patterns
     */
    enclavePatterns: {
        dmz: /\b(DMZ|demilitarized\s*zone|perimeter)\b/gi,
        internal: /\b(internal|corporate|private|intranet)\b/gi,
        external: /\b(external|internet|outside|public)\b/gi,
        redTeam: /\b(red\s*team|attack|offensive)\b/gi,
        blueTeam: /\b(blue\s*team|defense|defensive|SOC)\b/gi
    },

    /**
     * Operating System patterns
     */
    osPatterns: {
        linux: /\b(Linux|Ubuntu|Debian|RedHat|CentOS|Kali)\b/gi,
        windows: /\b(Windows|Win10|Win11|Server\s*20\d{2})\b/gi,
        router: /\b(VyOS|Cisco|Juniper|MikroTik)\b/gi,
        firewall: /\b(pfSense|Fortinet|Checkpoint)\b/gi
    }
};

/**
 * Helper functions for pattern matching
 */
export const PatternHelpers = {
    /**
     * Check if IP address is valid IPv4
     * @param {string} ip
     * @returns {boolean}
     */
    isValidIPv4(ip) {
        const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return pattern.test(ip);
    },

    /**
     * Extract hostname from text context
     * @param {string} text
     * @param {string} keyword
     * @param {number} windowSize
     * @returns {string}
     */
    getContextWindow(text, keyword, windowSize = 200) {
        const index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index === -1) return '';

        const start = Math.max(0, index - windowSize);
        const end = Math.min(text.length, index + keyword.length + windowSize);

        return text.substring(start, end);
    },

    /**
     * Classify node type based on name and role
     * @param {string} name
     * @param {string} role
     * @param {string} context
     * @returns {string} - 'actor', 'process', or 'store'
     */
    classifyNodeType(name, role, context = '') {
        const combined = `${name} ${role} ${context}`.toLowerCase();

        // Actors (external entities, attackers)
        if (T2TPatterns.rolePatterns.attacker.test(combined)) {
            return 'actor';
        }

        // Stores (databases, file systems)
        if (T2TPatterns.rolePatterns.database.test(combined)) {
            return 'store';
        }

        if (/\b(storage|nas|san|backup)\b/i.test(combined)) {
            return 'store';
        }

        // Everything else is a process (servers, routers, firewalls, etc.)
        return 'process';
    },

    /**
     * Extract services from context
     * @param {string} servicesText
     * @returns {string[]}
     */
    extractServices(servicesText) {
        const services = new Set();

        Object.entries(T2TPatterns.servicePatterns).forEach(([service, pattern]) => {
            if (pattern.test(servicesText)) {
                services.add(service);
            }
        });

        // Also extract port numbers
        const portMatches = servicesText.matchAll(/port\s*(\d+)/gi);
        for (const match of portMatches) {
            services.add(`port-${match[1]}`);
        }

        return Array.from(services);
    },

    /**
     * Detect protocol from context
     * @param {string} context
     * @returns {string}
     */
    detectProtocol(context) {
        for (const [protocol, pattern] of Object.entries(T2TPatterns.protocolPatterns)) {
            if (pattern.test(context)) {
                return protocol.toUpperCase();
            }
        }

        return 'TCP'; // Default
    },

    /**
     * Check if protocol is encrypted
     * @param {string} protocol
     * @returns {boolean}
     */
    isEncryptedProtocol(protocol) {
        const encryptedProtocols = ['HTTPS', 'SSH', 'LDAPS', 'SMTPS', 'FTPS', 'TLS', 'SSL'];
        return encryptedProtocols.includes(protocol.toUpperCase());
    }
};
