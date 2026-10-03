import "server-only";
import sanitizeHtml from "sanitize-html";

const allowedImageDataUrl =
  /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z\d+/]+=*$/i;

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "em",
      "h1",
      "h2",
      "h3",
      "hr",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "strong",
      "u",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      img: ["src", "alt", "title", "style"],
      p: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) =>
      frame.tag === "img" &&
      !/^https?:\/\//i.test(frame.attribs.src ?? "") &&
      !allowedImageDataUrl.test(frame.attribs.src ?? ""),
  });
}
