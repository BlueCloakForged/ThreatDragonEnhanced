# Sample Operational Test Plan - Network Security Assessment

## Mission Overview
This document outlines the network topology for the Red Team penetration testing exercise against the target organization's infrastructure.

## Network Topology

### System Inventory

| Hostname | Operating System | Architecture | IP Address | Role | Services |
|----------|------------------|--------------|------------|------|----------|
| Kali-01 | Kali Linux 2024.1 | x64 | 192.168.100.10 | Attacker | ssh, metasploit, nmap |
| Kali-02 | Kali Linux 2024.1 | x64 | 192.168.100.11 | Attacker | ssh, burpsuite, sqlmap |
| Kali-03 | Kali Linux 2024.1 | x64 | 192.168.100.12 | Attacker | ssh, cobalt-strike, bloodhound |
| Router-01 | VyOS 1.4 | x64 | 192.168.100.1 | Router | ssh, ospf, bgp |
| Router-02 | Cisco IOS 15.7 | x64 | 10.0.1.1 | Router | ssh, eigrp |
| Firewall-01 | pfSense 2.7 | x64 | 10.0.1.254 | Firewall | ssh, https, snmp |
| WebSrv-01 | Ubuntu 22.04 | x64 | 10.0.1.100 | Server | ssh, http, https, mysql |
| WebSrv-02 | Ubuntu 22.04 | x64 | 10.0.1.101 | Server | ssh, http, https, postgresql |
| WebSrv-03 | CentOS 8 | x64 | 10.0.1.102 | Server | ssh, http, nginx, redis |
| DC-01 | Windows Server 2022 | x64 | 172.16.0.10 | Server | rdp, ldap, smb, dns |
| DC-02 | Windows Server 2022 | x64 | 172.16.0.11 | Server | rdp, ldap, smb, dns |
| FileServer-01 | Windows Server 2019 | x64 | 172.16.0.20 | Server | smb, nfs, ftp |
| DB-Primary | PostgreSQL 15 | x64 | 10.0.2.50 | Database | postgresql, ssh |
| DB-Replica | PostgreSQL 15 | x64 | 10.0.2.51 | Database | postgresql, ssh |
| DB-Cache | Redis 7.0 | x64 | 10.0.2.52 | Database | redis, ssh |

## Attack Flow Description

### Phase 1: Initial Reconnaissance
The red team will use Kali-01, Kali-02, and Kali-03 to perform initial network scanning and enumeration from the 192.168.100.0/24 network.

### Phase 2: Network Traversal
1. Attackers will pivot through Router-01 to access the DMZ network (10.0.1.0/24)
2. From Router-01, the team will connect to Firewall-01 for rule enumeration
3. Router-02 provides secondary routing between DMZ and internal networks

### Phase 3: Web Application Testing
1. Kali-01 connects to WebSrv-01 for web application penetration testing
2. Kali-02 connects to WebSrv-02 to test API endpoints
3. Kali-03 targets WebSrv-03 for cache poisoning attacks
4. All web servers communicate with DB-Primary for data persistence
5. WebSrv-01 reads from DB-Replica for load balancing
6. WebSrv-02 and WebSrv-03 use DB-Cache for session storage

### Phase 4: Internal Network Compromise
1. From WebSrv-01, attackers will attempt to pivot to DC-01 via SMB
2. DC-01 replicates with DC-02 over secure LDAP channels
3. Both domain controllers authenticate users against each other
4. FileServer-01 is joined to the domain and authenticates via DC-01

### Phase 5: Data Exfiltration
1. Compromised credentials from DC-01 will be used to access FileServer-01
2. Database dumps will be extracted from DB-Primary
3. Data will be staged on WebSrv-01 before exfiltration through Firewall-01
4. Final exfiltration path: FileServer-01 → DC-01 → WebSrv-01 → Firewall-01 → Router-01

## Network Flows Summary

**External to DMZ:**
- Kali-01 → Router-01 → WebSrv-01
- Kali-02 → Router-01 → WebSrv-02
- Kali-03 → Router-01 → WebSrv-03
- Router-01 → Firewall-01 (traffic filtering)

**DMZ to Internal:**
- WebSrv-01 → DC-01 (authentication)
- WebSrv-02 → DC-02 (authentication)
- WebSrv-03 → Firewall-01 (egress traffic)

**Database Tier:**
- WebSrv-01 → DB-Primary (write operations)
- WebSrv-01 → DB-Replica (read operations)
- WebSrv-02 → DB-Cache (session management)
- WebSrv-03 → DB-Cache (caching layer)
- DB-Primary → DB-Replica (replication traffic)

**Internal Network:**
- DC-01 ↔ DC-02 (Active Directory replication)
- FileServer-01 → DC-01 (domain authentication)
- FileServer-01 → DC-02 (backup domain controller)

## Success Criteria

The red team will demonstrate successful compromise by:
1. Gaining initial foothold on WebSrv-01, WebSrv-02, or WebSrv-03
2. Pivoting from DMZ to internal network via domain controllers
3. Escalating privileges to Domain Admin on DC-01 or DC-02
4. Accessing sensitive data on FileServer-01
5. Extracting data from DB-Primary without detection
6. Maintaining persistence across Router-01 and Firewall-01

## Network Diagram Notes

- 192.168.100.0/24: Red Team attack network
- 10.0.1.0/24: DMZ hosting web servers and routing infrastructure
- 10.0.2.0/24: Database tier
- 172.16.0.0/16: Internal corporate network with AD infrastructure

## Encryption and Protocols

- SSH enabled on all Linux systems (port 22)
- HTTPS enabled on all web servers (port 443)
- LDAPS for domain controller communication (port 636)
- SMB3 with encryption for file shares (port 445)
- PostgreSQL with TLS (port 5432)
- Redis over TLS (port 6379)
