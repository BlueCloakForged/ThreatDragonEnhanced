<p align="center">
  <img src="td.vue/public/baby_dragon_glasses_doc.svg"
  width="200" alt="Threat Dragon Enhanced Logo"/>
</p>

# Threat Dragon Enhanced

> **🔬 Experimental Fork** - Built on [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon) v2.5.0

**Threat Dragon Enhanced** is a modified version of OWASP Threat Dragon with additional features for importing and converting operational documents into threat models.

[![GitHub license](https://img.shields.io/github/license/owasp/threat-dragon.svg)](license.txt)
[![OWASP Lab](https://img.shields.io/badge/owasp-lab%20project-f7b73c.svg)](https://owasp.org/projects/)

---

## ✨ Enhancements Over Original

### Core Features

| Feature | Description |
|---------|-------------|
| **T2T Import Wizard** | Import Operational Test Plans (OTP) and automatically generate threat model diagrams |
| **JSON Topology Import** | Import pre-structured network topology from JSON files |
| **Unified Validation Framework** | Comprehensive validation service with auto-fix capabilities |
| **X6 Cell Validator** | Validates diagram cells before rendering to prevent blank canvas issues |
| **Enhanced Canvas Tools** | Fit Content, Reset Zoom buttons for better diagram navigation |

### CWE/CAPEC Knowledge Base Integration

| Feature | Description |
|---------|-------------|
| **Offline KB Search** | Fast search across 969 CWE weaknesses and 615 CAPEC attack patterns |
| **Threat Dialog KB Pickers** | Searchable pickers for CWE/CAPEC with confidence toggle (suggested/confirmed) |
| **Get Suggestions** | Rules-based auto-suggestions based on node type, services, ports, and keywords |
| **Threat List KB Badges** | Visual indicators showing CAPEC (blue) and CWE (yellow) references |
| **Triage Filters** | Filter threats by missing CWE or CAPEC mappings |
| **Export with KB References** | KB references included in JSON exports and printed reports |
| **Element Suggestions Drawer** | Collapsible panel showing context-aware CAPEC/CWE recommendations for selected elements |

## 🙏 Credits

This project is based on [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon), created by [Mike Goodwin](https://github.com/mike-goodwin) and maintained by the OWASP community.

- **Original Project:** [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/)
- **Original Repository:** [github.com/OWASP/threat-dragon](https://github.com/OWASP/threat-dragon)
- **License:** [Apache 2.0](license.txt)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/BlueCloakForged/ThreatDragonEnhanced.git
cd ThreatDragonEnhanced

# Install dependencies
cd td.vue
npm install

# Run development server
npm run serve
```

Then open http://localhost:8080 in your browser.

---

## 📥 T2T Import Feature

The T2T (Test-to-Threat) Import Wizard allows you to:

1. **Upload** OTP documents (PDF, DOCX, TXT, MD) or JSON topology files
2. **Extract** network entities (actors, processes, stores) and data flows
3. **Validate** and edit extracted elements
4. **Choose layout** (tiered, radial, or hierarchical)
5. **Preview and import** the generated threat model

### JSON Topology Format

```json
{
  "nodes": [
    { "id": "1", "name": "Web Server", "type": "process" },
    { "id": "2", "name": "Database", "type": "store" }
  ],
  "flows": [
    { "id": "f1", "name": "SQL Query", "source": "1", "target": "2" }
  ]
}
```

---

## Original OWASP Threat Dragon

[OWASP][owasp] [Threat Dragon][project] is a free, open-source, cross-platform threat modeling application.
It is used to draw threat modeling diagrams and to list threats for elements in the diagram.
[Mike Goodwin](https://github.com/mike-goodwin) created Threat Dragon as an open source community project
that provides an intuitive and accessible way to model threats.

Threat Dragon is designed to be accessible for various types of teams, with an emphasis on flexibility and simplicity.
It is an [OWASP Lab Project][project] and follows the values and principles of the [threat modeling manifesto][manifesto].

This program is free software: you can redistribute it and/or modify it
under the terms of the [Apache 2.0 License][license].

## Try Threat Dragon

Access the latest version of Threat Dragon on [the demo website][demo] and refer to the [documentation pages][docs].

Also well worth watching the video provided by the
[OWASP Spotlight](https://www.youtube.com/playlist?list=PLUKo5k_oSrfOTl27gUmk2o-NBKvkTGw0T) series.

The [github release area][releases] contains Threat Dragon from version 1.3 to the latest versions 2.x.
Previous releases are from Mike Goodwin's
[original repository](https://github.com/mike-goodwin/owasp-threat-dragon-desktop/releases).

## About Threat Dragon

There is a good overview of
[threat modeling and risk assessment](https://owasp.org/www-community/Application_Threat_Modeling)
from OWASP, and this expands on what the Threat Dragon project aims for:

- ease of use and accessible
- designing a data flow diagram
- suggesting threats
- entering mitigations and counter measures

[Mike Goodwin](https://github.com/mike-goodwin) is the founder and creator of this project,
and this repository has been migrated from
Mike Goodwin's [original](https://github.com/mike-goodwin/owasp-threat-dragon)
which has the issues and pull requests from October 2015 up to June 2020.

Threat Dragon is [primarily a web application](https://github.com/OWASP/threat-dragon/releases).
The web application can store threat model files on the local filesystem; in addition access can be configured for :

- GitHub
- Bitbucket
- GitLab
- Github Enterprise

The [desktop versions](https://github.com/OWASP/threat-dragon/releases) of Threat Dragon
stores the threat model files on the local filesystem and do not access external repositories.
You can [download installers](https://github.com/OWASP/threat-dragon/releases) for Windows, MacOS and Linux.

End user help is available for both the latest [version 2.x][docs]
and the previous [version 1.x](https://owasp.org/www-project-threat-dragon/docs-1/).

### Version 1.x maintenance mode

Threat Dragon was originally written using AngularJS version 1.x, but this version of Angular reached end of life.
This means that versions 1.x of Threat Dragon are no longer actively maintained
and versions 2.x have been re-written to use Vue.js.

For more information on building/running version 1.x,
please see the [legacy-v1.x branch](https://github.com/OWASP/threat-dragon/tree/archive-legacy-v1.x).

### Building version 2.x

Install [git](https://git-scm.com/downloads/) and [node.js][node] which includes the node package manager npm

Clone the repository using: `git clone https://github.com/owasp/threat-dragon.git`

This downloads the code into a `threat-dragon` directory and the application code is in two sub-folders,
one for the back-end application (`td.server`) and one for the front-end (`td.vue`).

Install from the top directory of the project using : `npm install`

### Environment variables for web application

The web application variant of Threat Dragon requires some environment variables;
follow [the documentation][config] on how to set these variables.

If access to external repositories is required, such as Bitbucket / GitHub  / GitLab,
then you need to go to your repository account and register the application.
There are step by step guides on how to do this for [Bitbucket][bitbucket], [GitHub][github] and [GitLab][gitlab].

### Run the application

When running on Windows, and during development, the front-end and server back-end
can be started separately in "watch" mode using commands : `npm run dev:server` and `npm run dev:vue`.
Alternatively, if running on Linux or MacOS, start both the back-end server and the front-end application
from the top directory using : `npm start`.

With both front and back end running, access with a browser at `http://localhost:8080/`

### Stop the application

If using `npm start`, stop both the back-end server and the front-end application
from the top directory with command `npm stop`. Otherwise break out of both the server and vue front-end.

## Docker (from dockerhub)

Threat Dragon maintains docker images within the OWASP organisation area on Dockerhub.
Each release is tagged as `v{major}.{minor}.{patch}`, eg `v2.2.0`:

- `docker pull owasp/threat-dragon:v2.2.0`

The latest tag (which is the default) may well be a development version
so use the `stable` tag, which will always be the latest official release:

- `docker pull threatdragon/owasp-threat-dragon:stable`
- For MacOS and Linux:
- `docker run -it --rm -p 8080:3000 -v $(pwd)/.env:/app/.env threatdragon/owasp-threat-dragon:v2.2.0`
- For Windows:
- `docker run -it --rm -p 8080:3000 -v %CD%/.env:/app/.env threatdragon/owasp-threat-dragon:v2.2.0`

Assuming that you are using http port 8080 and accessing Threat Dragon on `http://localhost:8080/`.

### Docker (local build)

To run Threat Dragon in a docker container that has been built locally,
first configure your [environment using dotenv][config] and run from the top directory of the project:

- `docker build -t owasp-threat-dragon:dev .`
- `docker run -it --rm -p 8080:3000 -v $(pwd)/.env:/app/.env owasp-threat-dragon:dev`
- or if using Windows:
- `docker run -it --rm -p 8080:3000 -v %CD%/.env:/app/.env owasp-threat-dragon:dev`

Using http port 8080 and accessing Threat Dragon on `http://localhost:8080/`.

### Contributing

[![GitHub contributors](https://img.shields.io/github/contributors/owasp/threat-dragon.svg)][contributors]

Pull requests, feature requests, bug reports and feedback of any kind are very welcome,
please refer to the page for [contributors](contributing.md).

There are some [developer notes][notes] to help get started with this project.
We are trying to keep the test coverage relatively high so include tests in your pull requests.

The easiest way to get in contact with the Threat Dragon community is via the OWASP Slack
[#project-threat-dragon][td-slack] project channel (you may [need to subscribe][subscribe] first).

You can follow the Threat Dragon on [Bluesky][bluesky].

### Vulnerability disclosure

If you find a vulnerability in this project please let us know ASAP and we will fix it as a priority.
For secure disclosure, please see the [security policy](security.md).

### Project leaders

- [Mike Goodwin](mailto:mike.goodwin@owasp.org)
- [Jon Gadsden](mailto:jon.gadsden@owasp.org)
- [Leo Reading](mailto:leo.reading@owasp.org)

----

Threat Dragon: _making threat modeling less threatening_

[bluesky]: https://bsky.app/profile/threatdragon.bsky.social
[build]: https://github.com/OWASP/threat-dragon/actions/workflows/push.yaml
[bitbucket]: https://www.threatdragon.com/docs/configure/bitbucket.html
[contributors]: https://github.com/OWASP/threat-dragon/graphs/contributors
[demo]: https://www.threatdragon.com/#/
[docs]: https://www.threatdragon.com/docs/
[config]: https://www.threatdragon.com/docs/configure/configure.html
[github]: https://www.threatdragon.com/docs/configure/github.html
[gitlab]: https://www.threatdragon.com/docs/configure/gitlab.html
[latest]: https://github.com/owasp/threat-dragon/releases/latest
[license]: https://github.com/OWASP/threat-dragon/blob/v2.2.0/license.txt
[manifesto]: https://www.threatmodelingmanifesto.org/
[node]: https://nodejs.org/en/download
[notes]: https://www.threatdragon.com/docs/development/development.html
[owasp]: https://owasp.org/
[practices]: https://www.bestpractices.dev/en/projects/9266
[project]: https://owasp.org/www-project-threat-dragon/
[releases]: https://github.com/OWASP/threat-dragon/releases
[subscribe]: https://owasp.org/slack/invite
[td-slack]: https://owasp.slack.com/messages/CURE8PQ68
