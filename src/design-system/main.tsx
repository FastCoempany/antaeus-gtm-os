import { render } from "preact";
import { ProofSheet } from "./ProofSheet";
import "@/styles/tokens.css";
import "@/components/components.css";
import "@/lib/palette/palette.css";

/**
 * /design-system/ — the component-library proof sheet (spec 03).
 * Internal surface; not linked from any room, no feature flag, no
 * data. Renders the built library so the implementation can be
 * reviewed the way the icon inventory sheet reviews glyphs.
 */
const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Proof sheet could not mount: #app root element missing from index.html"
    );
}
render(<ProofSheet />, root);
