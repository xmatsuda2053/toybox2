import { html, unsafeCSS, LitElement, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@shared/components";
import { dispatchCustomEvent } from "@shared/utils";
import type { Contact } from "@/types";
import styles from "./task-contact.scss?inline";

/**
 * contacts-change カスタムイベントの詳細情報
 */
export interface ContactsChangeEventDetail {
  contacts: Contact[];
  action: "add" | "remove" | "update";
  index?: number;
}

/**
 * 入力フィールドに対応するアイコン名マッピング
 */
const CONTACT_FIELD_ICONS: Record<keyof Contact, string> = {
  div: "building-solid-full",
  name: "user-solid-full",
  tel: "phone-solid-full",
};

/**
 * 関係者一覧・動的追加入力サブコンポーネント (TaskContact)
 *
 * @export
 * @class TaskContact
 * @extends {LitElement}
 */
@customElement("task-contact")
export class TaskContact extends LitElement {
  public static styles = unsafeCSS(styles);

  /**
   * 関係者一覧データ
   */
  @property({ type: Array })
  public contacts: Contact[] = [];

  /**
   * 新規行追加ハンドラー
   */
  public handleAdd = (): void => {
    const nextContacts: Contact[] = [
      ...this.contacts,
      { div: "", name: "", tel: "" },
    ];
    dispatchCustomEvent<ContactsChangeEventDetail>(this, "contacts-change", {
      detail: {
        contacts: nextContacts,
        action: "add",
      },
    });
  };

  /**
   * 行削除ハンドラー
   */
  public handleRemove = (index: number): void => {
    const nextContacts = this.contacts.filter((_, i) => i !== index);
    dispatchCustomEvent<ContactsChangeEventDetail>(this, "contacts-change", {
      detail: {
        contacts: nextContacts,
        action: "remove",
        index,
      },
    });
  };

  /**
   * 入力変更ハンドラー
   */
  public handleInputChange = (
    index: number,
    field: keyof Contact,
    value: string,
  ): void => {
    const nextContacts = this.contacts.map((contact, i) => {
      if (i !== index) {
        return contact;
      }
      return {
        ...contact,
        [field]: value,
      };
    });
    dispatchCustomEvent<ContactsChangeEventDetail>(this, "contacts-change", {
      detail: {
        contacts: nextContacts,
        action: "update",
        index,
      },
    });
  };

  /**
   * 単一入力フィールドの描画
   */
  private renderInputField(
    field: keyof Contact,
    value: string,
    placeholder: string,
    index: number,
  ): HTMLTemplateResult {
    const iconName = CONTACT_FIELD_ICONS[field];
    return html`
      <div class="task-contact__field">
        <wa-input
          class="task-contact__input task-contact__input--${field}"
          size="small"
          placeholder=${placeholder}
          .title=${value}
          .value=${value}
          @input=${(e: Event) =>
            this.handleInputChange(
              index,
              field,
              (e.target as HTMLInputElement).value,
            )}
        >
          <wa-icon
            slot="start"
            class="task-contact__input-icon"
            library="my-icons"
            name=${iconName}
          ></wa-icon>
        </wa-input>
      </div>
    `;
  }

  /**
   * 空状態テンプレートの描画
   */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="task-contact__empty">
        <span class="task-contact__empty-text">関係者は未登録です</span>
      </div>
    `;
  }

  /**
   * 単一関係者行テンプレートの描画
   */
  private renderContactRow(
    contact: Contact,
    index: number,
  ): HTMLTemplateResult {
    return html`
      <div class="task-contact__row">
        ${this.renderInputField("div", contact.div, "所属", index)}
        ${this.renderInputField("name", contact.name, "氏名", index)}
        ${this.renderInputField("tel", contact.tel, "連絡先", index)}
        <wa-icon
          class="task-contact__btn-remove"
          library="my-icons"
          name="trash-solid-full"
          aria-label="削除"
          role="button"
          tabindex="0"
          @click=${() => this.handleRemove(index)}
          @keydown=${(e: KeyboardEvent) =>
            (e.key === "Enter" || e.key === " ") && this.handleRemove(index)}
        ></wa-icon>
      </div>
    `;
  }

  /**
   * 関係者一覧テンプレートの描画
   */
  private renderContactList(): HTMLTemplateResult {
    return html`
      <div class="task-contact__list">
        ${this.contacts.map((c, i) => this.renderContactRow(c, i))}
      </div>
    `;
  }

  /**
   * メインレンダリング
   */
  public render(): HTMLTemplateResult {
    if (this.contacts.length === 0) {
      return html` <div class="task-contact">${this.renderEmptyState()}</div> `;
    }

    return html` <div class="task-contact">${this.renderContactList()}</div> `;
  }
}
