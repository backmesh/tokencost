import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Backmesh",
  // open source Firebase for LLM APIs
  // control panel for AI Apps
  // open source Firebase for LLM APIs
  // Firebase for LLM APIs"
  // open source BaaS for LLM APIs
  // JWT Proxy for LLM APIs
  // open source Backend for LLM APIs
  // open source BaaS for AI apps
  tagline: "Open Source BaaS for AI apps",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://backmesh.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "backmesh", // Usually your GitHub org/user name.
  projectName: "backmesh", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: false,
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "posthog-docusaurus",
      {
        apiKey: "phc_fZ3tyt5smshwvm17JYlrU8PbxUVlOoakvH2M5b6ktdO",
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // announcementBar: {
    //   id: "product-hunt-banner", // Any value that will identify this message.
    //   content:
    //     'We are live on Product Hunt! 🎉 Check us out and support us <a target="_blank" rel="noopener noreferrer" href="https://www.producthunt.com/posts/backmesh">here</a>!',
    //   backgroundColor: "#DA552F", // Product Hunt's brand color.
    //   textColor: "#ffffff", // White text color for contrast.
    //   isCloseable: true, // Defaults to `true`.
    // },
    navbar: {
      title: "Backmesh",
      logo: {
        alt: "Backmesh Logo",
        src: "img/logo.png",
        style: { padding: "4px" },
        href: "https://backmesh.com",
      },
      items: [
        {
          to: "https://backmesh.com/docs",
          position: "left",
          label: "Docs",
          target: "_self",
        },
        {
          href: "https://github.com/backmesh/backmesh",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    footer: {
      links: [],
      copyright: `Made with <a href="https://backmesh.com" target="_self" rel="noopener noreferrer">Backmesh</a> and <a href="https://github.com/backmesh/tokencost" target="_self" rel="noopener noreferrer">tokencost-js</a>.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
