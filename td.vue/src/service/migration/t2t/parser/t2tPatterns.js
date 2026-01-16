/**
 * T2T Extraction Patterns
 * Regex patterns for extracting entities from OTP documents
 *
 * Enhanced with patterns from T2T Pipeline Agent (entity_extractor.py)
 * Supports comprehensive OS, service, network, and role detection
 */

/**
 * Operating System patterns with template hints and default roles
 * Format: { pattern, templateHint, defaultRole }
 * Ported from Python T2T Pipeline Agent
 */
export const OS_PATTERNS = [
    // Attack/Pentest OS
    { pattern: /\b(kali(?:\s*linux)?(?:\s*\d+(?:\.\d+)?)?)\b/i, hint: 'kali', role: 'attacker' },
    { pattern: /\b(parrot(?:\s*(?:os|sec))?)\b/i, hint: 'parrot', role: 'attacker' },
    { pattern: /\b(black\s*arch)\b/i, hint: 'blackarch', role: 'attacker' },
    // Network OS
    { pattern: /\b(vyos(?:\s*\d+(?:\.\d+)?)?)\b/i, hint: 'vyos', role: 'router' },
    { pattern: /\b(pfsense|pf-sense)(?:\s*[\d.]+)?\b/i, hint: 'pfsense', role: 'firewall' },
    { pattern: /\b(opnsense)(?:\s*[\d.]+)?\b/i, hint: 'opnsense', role: 'firewall' },
    // Linux Distributions
    { pattern: /\b(ubuntu(?:\s*(?:server|desktop|lts))?(?:\s*\d+(?:\.\d+)?)?)\b/i, hint: 'ubuntu', role: 'server' },
    { pattern: /\b(centos(?:\s*(?:stream)?\s*\d+)?)\b/i, hint: 'centos', role: 'server' },
    { pattern: /\b(debian(?:\s*\d+)?)\b/i, hint: 'debian', role: 'server' },
    { pattern: /\b(fedora(?:\s*\d+)?)\b/i, hint: 'fedora', role: 'workstation' },
    { pattern: /\b(red\s*hat|rhel(?:\s*\d+)?)\b/i, hint: 'rhel', role: 'server' },
    { pattern: /\b(rocky\s*linux(?:\s*\d+)?)\b/i, hint: 'rocky', role: 'server' },
    { pattern: /\b(alma\s*linux(?:\s*\d+)?)\b/i, hint: 'almalinux', role: 'server' },
    { pattern: /\b(oracle\s*linux(?:\s*\d+)?)\b/i, hint: 'oracle-linux', role: 'server' },
    { pattern: /\b(suse|sles)(?:\s*\d+)?\b/i, hint: 'suse', role: 'server' },
    { pattern: /\b(arch\s*linux)\b/i, hint: 'arch', role: 'workstation' },
    // BSD variants
    { pattern: /\b(freebsd(?:\s*\d+)?)\b/i, hint: 'freebsd', role: 'server' },
    { pattern: /\b(openbsd(?:\s*\d+)?)\b/i, hint: 'openbsd', role: 'firewall' },
    // Windows
    { pattern: /\b(windows\s*(?:server\s*)?(?:20\d{2}|1[01]|xp|7|8)(?:\s*r2)?)\b/i, hint: 'windows', role: 'server' },
    { pattern: /\b(windows\s*10)\b/i, hint: 'windows10', role: 'workstation' },
    { pattern: /\b(windows\s*11)\b/i, hint: 'windows11', role: 'workstation' },
    // Vulnerable/Test OS
    { pattern: /\b(metasploitable(?:\s*\d)?)\b/i, hint: 'metasploitable', role: 'victim' },
    { pattern: /\b(dvwa)\b/i, hint: 'dvwa', role: 'victim' },
    // Embedded/IoT
    { pattern: /\b(openwrt)\b/i, hint: 'openwrt', role: 'router' },
    { pattern: /\b(raspb(?:erry\s*pi|ian))\b/i, hint: 'raspbian', role: 'iot_device' },
    { pattern: /\b(popos|pop[_\s]?os)(?:\s*[\d.]+)?\b/i, hint: 'popos', role: 'workstation' },
    // Hypervisors
    { pattern: /\b(esxi(?:\s*\d+(?:\.\d+)*)?)\b/i, hint: 'esxi', role: 'hypervisor' },
    { pattern: /\b(vmware\s*(?:vsphere|esx(?:i)?)?(?:\s*\d+(?:\.\d+)?)?)\b/i, hint: 'esxi', role: 'hypervisor' },
    { pattern: /\b(proxmox(?:\s*ve)?(?:\s*\d+(?:\.\d+)?)?)\b/i, hint: 'proxmox', role: 'hypervisor' },
    { pattern: /\b(hyper[-\s]?v(?:\s*server)?)\b/i, hint: 'hyperv', role: 'hypervisor' },
    { pattern: /\b(vcenter(?:\s*server)?(?:\s*[\d.]+)?)\b/i, hint: 'vcenter', role: 'hypervisor' },
    // Network devices
    { pattern: /\b(mikrotik(?:\s*(?:routeros)?(?:\s*rb\d+)?)?)\b/i, hint: 'mikrotik', role: 'router' },
    { pattern: /\b(routeros(?:\s*[\d.]+)?)\b/i, hint: 'mikrotik', role: 'router' },
    { pattern: /\b(cisco\s*ios(?:\s*[\d.]+)?)\b/i, hint: 'cisco-ios', role: 'router' },
    { pattern: /\b(junos(?:\s*[\d.]+)?)\b/i, hint: 'junos', role: 'router' },
    // Containers
    { pattern: /\b(docker(?:\s*(?:ce|ee))?(?:\s*[\d.]+)?)\b/i, hint: 'docker', role: 'server' },
    { pattern: /\b(kubernetes|k8s)\b/i, hint: 'kubernetes', role: 'server' },
    { pattern: /\b(podman)\b/i, hint: 'podman', role: 'server' },
];

/**
 * Service patterns with default ports
 * Format: { pattern, service, port }
 */
export const SERVICE_PATTERNS = [
    { pattern: /\b(ssh|sshd)\b/i, service: 'ssh', port: 22 },
    { pattern: /\b(http|web\s*server|apache|nginx)\b/i, service: 'http', port: 80 },
    { pattern: /\b(https|ssl|tls)\b/i, service: 'https', port: 443 },
    { pattern: /\b(ftp|ftpd)\b/i, service: 'ftp', port: 21 },
    { pattern: /\b(mysql|mariadb)\b/i, service: 'mysql', port: 3306 },
    { pattern: /\b(postgresql|postgres)\b/i, service: 'postgresql', port: 5432 },
    { pattern: /\b(rdp|remote\s*desktop)\b/i, service: 'rdp', port: 3389 },
    { pattern: /\b(smb|samba|cifs)\b/i, service: 'smb', port: 445 },
    { pattern: /\b(dns|named|bind)\b/i, service: 'dns', port: 53 },
    { pattern: /\b(ldap|active\s*directory)\b/i, service: 'ldap', port: 389 },
    { pattern: /\b(modbus)\b/i, service: 'modbus', port: 502 },
    { pattern: /\b(opc(?:-ua)?|opc\s*ua)\b/i, service: 'opc', port: 4840 },
    { pattern: /\b(telnet)\b/i, service: 'telnet', port: 23 },
    { pattern: /\b(snmp)\b/i, service: 'snmp', port: 161 },
    { pattern: /\b(mqtt)\b/i, service: 'mqtt', port: 1883 },
    { pattern: /\b(metasploit|msfconsole|meterpreter)\b/i, service: 'metasploit', port: null },
    { pattern: /\b(burp|burpsuite)\b/i, service: 'burpsuite', port: null },
];

/**
 * Network/enclave patterns
 * Format: { pattern, name }
 */
export const NETWORK_PATTERNS = [
    { pattern: /\b(dmz|demilitarized\s*zone)\b/i, name: 'DMZ' },
    { pattern: /\b(internal|corp(?:orate)?|lan)\b/i, name: 'Internal' },
    { pattern: /\b(external|internet|wan)\b/i, name: 'External' },
    { pattern: /\b(management|mgmt|oob)\b/i, name: 'Management' },
    { pattern: /\b(enclave|segment|zone)\b/i, name: 'Enclave' },
    { pattern: /\b(red\s*(?:team\s*)?(?:network|enclave|zone))\b/i, name: 'Red Team' },
    { pattern: /\b(blue\s*(?:team\s*)?(?:network|enclave|zone))\b/i, name: 'Blue Team' },
    { pattern: /\b(gray(?:space)?|simulation)\b/i, name: 'Grayspace' },
    { pattern: /\b(target\s*(?:space|network|environment))\b/i, name: 'Target Space' },
    { pattern: /\b(whitecell|white\s*cell)\b/i, name: 'Whitecell' },
];

/**
 * Role/function patterns
 * Format: { pattern, role }
 */
export const ROLE_PATTERNS = [
    { pattern: /\b(attacker|red\s*team|adversary|threat\s*actor)\b/i, role: 'attacker' },
    { pattern: /\b(defender|blue\s*team|analyst)\b/i, role: 'defender' },
    { pattern: /\b(router|gateway|edge\s*device)\b/i, role: 'router' },
    { pattern: /\b(firewall|fw|security\s*appliance)\b/i, role: 'firewall' },
    { pattern: /\b(switch|l2\s*switch|layer\s*2)\b/i, role: 'switch' },
    { pattern: /\b(server|host|backend)\b/i, role: 'server' },
    { pattern: /\b(workstation|client|desktop|endpoint)\b/i, role: 'workstation' },
    { pattern: /\b(victim|target|vulnerable)\b/i, role: 'victim' },
    { pattern: /\b(pivot|jump\s*(?:box|host)|bastion)\b/i, role: 'pivot' },
    { pattern: /\b(plc|hmi|scada|ics|rtu)\b/i, role: 'ics_device' },
    { pattern: /\b(iot|sensor|embedded)\b/i, role: 'iot_device' },
    { pattern: /\b(hypervisor|esxi\s*(?:host|server)?|vm\s*host)\b/i, role: 'hypervisor' },
    { pattern: /\b(instrumentation|monitoring|siem|ids|nids)\b/i, role: 'instrumentation' },
    { pattern: /\b(redirect(?:or)?|socat|tunnel|proxy)\b/i, role: 'redirector' },
];

/**
 * Instrumentation patterns (Security Onion, CDAP, etc.)
 */
export const INSTRUMENTATION_PATTERNS = [
    { pattern: /\b(security\s*onion)\b/i, name: 'Security Onion', role: 'instrumentation' },
    { pattern: /\b(cdap)\b/i, name: 'CDAP', role: 'instrumentation' },
    { pattern: /\b(splunk)\b/i, name: 'Splunk', role: 'instrumentation' },
    { pattern: /\b(elastic(?:search)?)\b/i, name: 'Elasticsearch', role: 'instrumentation' },
    { pattern: /\b(zeek|bro)\b/i, name: 'Zeek', role: 'instrumentation' },
    { pattern: /\b(suricata)\b/i, name: 'Suricata', role: 'instrumentation' },
    { pattern: /\b(arkime|moloch)\b/i, name: 'Arkime', role: 'instrumentation' },
];

/**
 * Regex patterns for entity extraction (legacy format for backward compatibility)
 */
export const T2TPatterns = {
    /**
     * Node extraction patterns
     */
    nodePatterns: {
        // Markdown table row format
        tableRow: /\|\s*([A-Za-z0-9_-]+)\s*\|[^|]*\|[^|]*\|\s*([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s*\|\s*([A-Za-z]+)\s*\|\s*([^|]+)\s*\|/g,

        // Inline format: NodeName (192.168.1.1)
        inline: /\b([A-Za-z][A-Za-z0-9_-]+)\s*\(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\)/g,

        // Common system names (enhanced)
        systemNames: /\b(Kali|Ubuntu|Windows|Server|Router|Firewall|pfSense|VyOS|DC-\d+|WS-\d+|WebSrv|FW-\d+|Mikrotik|ESXi|Proxmox|CentOS|Debian|RHEL)[A-Za-z0-9_-]*/gi
    },

    /**
     * IP address pattern
     */
    ipPattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/\d{1,2})?\b/g,

    /**
     * Service detection patterns (legacy - use SERVICE_PATTERNS for new code)
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
    },

    /**
     * Extract operating systems from text using enhanced patterns
     * @param {string} text
     * @returns {Array<{name: string, hint: string, role: string, confidence: number}>}
     */
    extractOperatingSystems(text) {
        const results = [];
        const seen = new Set();

        for (const { pattern, hint, role } of OS_PATTERNS) {
            const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
            for (const match of matches) {
                const name = match[1].trim();
                const key = name.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({
                        name,
                        hint,
                        role,
                        confidence: 0.9,
                        sourceText: match[0]
                    });
                }
            }
        }
        return results;
    },

    /**
     * Extract services from text using enhanced patterns
     * @param {string} text
     * @returns {Array<{service: string, port: number|null}>}
     */
    extractServicesEnhanced(text) {
        const results = [];
        const seen = new Set();

        for (const { pattern, service, port } of SERVICE_PATTERNS) {
            if (pattern.test(text)) {
                if (!seen.has(service)) {
                    seen.add(service);
                    results.push({ service, port });
                }
            }
        }
        return results;
    },

    /**
     * Extract network/enclave references from text
     * @param {string} text
     * @returns {Array<{name: string, confidence: number}>}
     */
    extractNetworks(text) {
        const results = [];
        const seen = new Set();

        for (const { pattern, name } of NETWORK_PATTERNS) {
            if (pattern.test(text)) {
                if (!seen.has(name)) {
                    seen.add(name);
                    results.push({ name, confidence: 0.8 });
                }
            }
        }
        return results;
    },

    /**
     * Extract roles from text
     * @param {string} text
     * @returns {Array<{role: string, confidence: number}>}
     */
    extractRoles(text) {
        const results = [];
        const seen = new Set();

        for (const { pattern, role } of ROLE_PATTERNS) {
            if (pattern.test(text)) {
                if (!seen.has(role)) {
                    seen.add(role);
                    results.push({ role, confidence: 0.85 });
                }
            }
        }
        return results;
    },

    /**
     * Extract IP addresses from text
     * @param {string} text
     * @returns {Array<string>}
     */
    extractIPAddresses(text) {
        const ipPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)\b/g;
        const matches = text.matchAll(ipPattern);
        const ips = new Set();
        for (const match of matches) {
            ips.add(match[1]);
        }
        return Array.from(ips);
    },

    /**
     * Extract all entities from text (comprehensive extraction)
     * @param {string} text
     * @returns {Object} - { os, services, networks, roles, ips }
     */
    extractAllEntities(text) {
        return {
            os: this.extractOperatingSystems(text),
            services: this.extractServicesEnhanced(text),
            networks: this.extractNetworks(text),
            roles: this.extractRoles(text),
            ips: this.extractIPAddresses(text)
        };
    }
};
