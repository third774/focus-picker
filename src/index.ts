const template = document.createElement("template");

template.innerHTML = `
<style>
  .container {
    position: relative;
  }

  svg {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  slot {
    pointer-events: none;
  }
</style>
<div class="container">
  <slot></slot>
  <svg style="top: 50%; left: 50%;" height="20" width="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" fill="rgba(0,0,0,0.5)" />
    <circle cx="10" cy="10" r="8" fill="rgba(0,0,0,0)" stroke="white" stroke-width="3" />
  </svg>
</div>
`;

class FocusPicker extends HTMLElement {
  img: HTMLImageElement | HTMLPictureElement;
  get indicator() {
    const svg = this.shadowRoot?.querySelector("svg");
    if (!svg) {
      throw new Error("svg not found");
    }
    return svg;
  }
  onfocuspicked: Function | null = null;

  static get observedAttributes() {
    return ["onfocuspicked"];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "onfocuspicked") {
      this.onfocuspicked = new Function("event", newValue);
    }
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    const img = this.querySelector("img, picture") as
      | null
      | HTMLImageElement
      | HTMLPictureElement;
    if (img === null) {
      throw new Error(
        "focus-picker must contain either an img or a picture element"
      );
    }
    this.img = img;
    this.img.style.maxWidth = "100%";
    this.img.style.display = "block";

    this.addEventListener("pointerdown", (e) => this.handlePointerDown(e));
    this.addEventListener("pointermove", (e) => this.handlePointerMove(e));
    this.addEventListener("pointerup", (e) => this.handlePointerUp(e));
    this.addEventListener("pointercancel", (e) => this.handleEndDragging(e));
    this.addEventListener("lostpointercapture", (e) =>
      this.handleEndDragging(e)
    );
  }

  isDragging = false;

  handlePointerDown(e: PointerEvent) {
    if (e.cancelable) e.preventDefault();
    this.isDragging = true;
    // capture the pointer so we can drag outside the element
    this.setPointerCapture(e.pointerId);
  }

  handlePointerUp(e: PointerEvent) {
    if (e.cancelable) e.preventDefault();
    this.handlePointerMove(e);
    this.handleEndDragging(e);
  }

  handleEndDragging(e: PointerEvent) {
    if (e.cancelable) e.preventDefault();
    this.isDragging = false;
    this.releasePointerCapture(e.pointerId);
  }

  handlePointerMove(e: PointerEvent) {
    if (e.cancelable) e.preventDefault();
    if (!this.isDragging) {
      return;
    }
    const boundingRect = this.getBoundingClientRect();
    const x = Math.min(
      Math.max((e.clientX - boundingRect.left) / boundingRect.width, 0),
      1
    );
    const y = Math.min(
      Math.max((e.clientY - boundingRect.top) / boundingRect.height, 0),
      1
    );

    this.indicator.style.top = `${y * 100}%`;
    this.indicator.style.left = `${x * 100}%`;

    const position = `${(x * 100).toFixed(3)}% ${(y * 100).toFixed(3)}%`;
    const event = new CustomEvent("focuspicked", {
      detail: { position, x, y },
    });
    this.dispatchEvent(event);
    if (this.onfocuspicked) {
      this.onfocuspicked(event);
    }
  }
}

window.customElements.define("focus-picker", FocusPicker);
