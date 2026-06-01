import { render } from "preact";
import { CloudSeedPage } from "./CloudSeedPage";
import { initObservability } from "@/lib/observability";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error("CloudSeedPage could not mount: #app missing");
}
render(<CloudSeedPage />, root);
