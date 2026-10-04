import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTES = [
  "/reset",
  "/next-easiest-step",
  "/next-easiest-step-v2",
  "/night-channel",
  "/parking-lot",
  "/signal-lock",
  "/vector-shift",
];

const STYLE_ID = "mentation-clickable-answer-style";
const MARK = "data-mentation-clickable-answers";

function suggestionsFor(field) {
  const context = [
    field.getAttribute("aria-label"),
    field.getAttribute("placeholder"),
    field.getAttribute("name"),
    field.id,
  ].filter(Boolean).join(" ").toLowerCase();

  if (/evidence|support|true|fact|know for certain|observable/.test(context)) {
    return ["Something I directly observed", "What I know for certain", "A specific example"];
  }
  if (/against|another way|alternative|exception|unknown|other explanation/.test(context)) {
    return ["There may be another explanation", "I don’t have all the information yet", "There have been exceptions"];
  }
  if (/thought|prediction|worry|fear|concern/.test(context)) {
    return ["I’m not sure yet", "It might not be as certain as it feels", "There could be another explanation"];
  }
  if (/task|action|step|stuck|start|focus/.test(context)) {
    return ["Open the thing I need", "Do the first two minutes", "Choose the smallest visible step"];
  }
  if (/feel|emotion|mood|state/.test(context)) {
    return ["Tense", "Flat", "Overwhelmed", "Unsure"];
  }
  if (/note|park|remember|unfinished|tomorrow/.test(context)) {
    return ["Something unfinished", "Something I need to remember", "Something I can deal with tomorrow"];
  }
  if (/reason|because|why/.test(context)) {
    return ["I’m not completely sure", "There may be more than one reason", "One part of it is"];
  }
  return ["I’m not sure yet", "Something small", "A simple first answer"];
}

function setNativeValue(field, value, doc) {
  const view = doc.defaultView || window;
  const isTextArea = field.tagName === "TEXTAREA";
  const proto = isTextArea ? view.HTMLTextAreaElement?.prototype : view.HTMLInputElement?.prototype;
  const setter = proto && Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(field, value);
  else field.value = value;
  field.dispatchEvent(new view.Event("input", { bubbles: true }));
  field.dispatchEvent(new view.Event("change", { bubbles: true }));
  field.focus();
}

function ensureStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mentation-answer-rail {
      display:flex; flex-wrap:wrap; gap:.5rem; width:100%; margin:.6rem 0 .2rem;
    }
    .mentation-answer-chip {
      min-height:2.5rem; max-width:100%; padding:.55rem .85rem; border-radius:999px;
      border:1px solid color-mix(in srgb, currentColor 22%, transparent);
      background:color-mix(in srgb, currentColor 6%, transparent);
      color:inherit; font:inherit; font-size:.82rem; line-height:1.15; text-align:left;
      cursor:pointer; -webkit-tap-highlight-color:transparent;
    }
    .mentation-answer-chip:active { transform:scale(.985); }
    @media (max-width:640px) {
      .mentation-answer-rail { gap:.4rem; }
      .mentation-answer-chip { min-height:2.35rem; padding:.5rem .72rem; font-size:.78rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .mentation-answer-chip { transition:none!important; transform:none!important; }
    }
  `;
  doc.head?.appendChild(style);
}

function eligible(field, doc) {
  const view = doc.defaultView || window;
  const isInput = view.HTMLInputElement && field instanceof view.HTMLInputElement;
  const isTextArea = view.HTMLTextAreaElement && field instanceof view.HTMLTextAreaElement;
  if (!isInput && !isTextArea) return false;
  if (field.disabled || field.readOnly || field.hidden) return false;
  if (isInput) {
    const type = (field.type || "text").toLowerCase();
    if (!["text", "search", "email", "url", "tel"].includes(type)) return false;
  }
  if (field.closest("[data-no-clickable-answers]")) return false;
  return true;
}

function enhanceField(field, doc) {
  if (!eligible(field, doc) || field.hasAttribute(MARK)) return;
  field.setAttribute(MARK, "true");

  const rail = doc.createElement("div");
  rail.className = "mentation-answer-rail";
  rail.setAttribute("role", "group");
  rail.setAttribute("aria-label", "Suggested answers");

  suggestionsFor(field).forEach((answer) => {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "mentation-answer-chip";
    button.textContent = answer;
    button.addEventListener("click", () => setNativeValue(field, answer, doc));
    rail.appendChild(button);
  });

  field.insertAdjacentElement("afterend", rail);
}

export function installClickableSuggestions(doc = document) {
  if (!doc?.body) return () => {};
  ensureStyle(doc);

  const scan = (root = doc) => {
    root.querySelectorAll?.("input, textarea").forEach((field) => enhanceField(field, doc));
  };

  scan();
  const Observer = doc.defaultView?.MutationObserver || MutationObserver;
  const observer = new Observer((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.("input, textarea")) enhanceField(node, doc);
        scan(node);
      });
    }
  });
  observer.observe(doc.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export default function ClickableAnswerAssist() {
  const location = useLocation();

  useEffect(() => {
    if (!ROUTES.some((route) => location.pathname.startsWith(route))) return undefined;
    return installClickableSuggestions(document);
  }, [location.pathname]);

  return null;
}
