import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { classMap } from "lit/directives/class-map.js";

@customElement("md-note")
export class MDNote extends LitElement {
  static *initUuid() {
    let i = 0;
    while (true) yield i++;
  }

  static generateUuid = MDNote.initUuid();

  static getUuid() {
    return this.generateUuid.next().value;
  }

  static styles = css`
    .area {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
      user-select: none;
      -ms-user-select: none;
      -webkit-user-select: none;
    }
    .color {
      position: absolute;
    }
    .label {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .active {
      filter: brightness(1.2) contrast(120%) saturate(120%);
    }
  `;

  // non-reactive, private property
  #currentUuid: number | void = 0;

  // reactive properties
  @property({ type: Boolean, attribute: "not-playable" })
  notPlayable: boolean = false;

  @property({ type: Number, attribute: "midi" })
  midi?: number | number[];

  @property({ type: String, attribute: "color" })
  color?: string;

  @property({ type: String, attribute: "color-width" })
  colorWidth?: string;

  @property({ type: String, attribute: "color-height" })
  colorHeight?: string;

  @property({ type: String, attribute: "label" })
  label?: string;

  @property({ type: Number, attribute: "course" })
  course?: number;

  @property({ type: Number, attribute: "fret" })
  fret?: number;

  // internal reactive state
  // for some reason #active is not allowed
  // ts says: Decorators are not valid here.
  @state()
  private _active: boolean = false;

  #handlePointerDown(
    event: PointerEvent & {
      target: HTMLDivElement;
    }
  ) {
    if (event.pointerType === "touch") {
      // if initiated by a touch event, a pointerover event will fire before
      // the pointerdown event (the browser does this)
      // so let #handlePointerOver handle the dispatch of the mdnoteon event
      // and just release the pointer capture here
      event.target.releasePointerCapture(event.pointerId);
    } else {
      if (!this.notPlayable && !this._active) {
        this.#noteOn();
        this._active = true;
      }
    }
  }

  #handlePointerOver(event: PointerEvent) {
    if (event.buttons && !this.notPlayable && !this._active) {
      this.#noteOn();
      this._active = true;
    }
  }

  #handlePointerUp() {
    if (this._active) {
      this.#noteOff();
      this._active = false;
    }
  }

  #handlePointerLeave() {
    if (this._active) {
      this.#noteOff();
      this._active = false;
    }
  }

  #noteOn() {
    this.#currentUuid = MDNote.getUuid();
    const noteOnEvent = new CustomEvent("mdnoteon", {
      bubbles: true,
      detail: {
        uuid: this.#currentUuid,
        midi: this.midi,
        color: this.color,
        label: this.label,
        course: this.course,
        fret: this.fret,
      },
    });
    this.dispatchEvent(noteOnEvent);
  }

  #noteOff() {
    const noteOffEvent = new CustomEvent("mdnoteoff", {
      bubbles: true,
      detail: {
        uuid: this.#currentUuid,
        midi: this.midi,
        color: this.color,
        label: this.label,
        course: this.course,
        fret: this.fret,
      },
    });
    this.dispatchEvent(noteOffEvent);
  }

  render() {
    const styles = {
      backgroundColor: this.color,
      width: this.colorWidth,
      height: this.colorHeight,
    };
    const classes = {
      active: this._active,
    };

    return html` <div
      part="area"
      @pointerdown="${this.#handlePointerDown}"
      @pointerover="${this.#handlePointerOver}"
      @pointerup="${this.#handlePointerUp}"
      @pointerleave="${this.#handlePointerLeave}"
      class="area"
    >
      <div
        part="color"
        style=${styleMap(styles)}
        class="${classMap(classes)}"
      ></div>
      <div part="label" class="label ${classMap(classes)}">${this.label}</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "md-note": MDNote;
  }
}
