import { render } from "@react-email/render";
import type { ReactElement } from "react";

/** Renders a React Email template to HTML and plain text (multipart-ready). */
export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
