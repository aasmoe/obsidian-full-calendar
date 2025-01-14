import { Modal, App, Setting } from "obsidian";

interface MultiSelectModalProps {
    app: App;
    title: string;
    options: Record<string, string>;
    selected: string[];
    onSubmit: (selected: string[]) => void;
}

export class MultiSelectModal extends Modal {
    title: string;
    options: Record<string, string>;
    selected: string[];
    onSubmit: (selected: string[]) => void;

    constructor({
        app,
        title,
        options,
        selected,
        onSubmit,
    }: MultiSelectModalProps) {
        super(app);
        this.title = title;
        this.options = options;
        this.selected = selected;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: this.title });

        Object.entries(this.options).forEach(([value, display]) => {
            new Setting(contentEl).setName(display).addToggle((toggle) => {
                toggle.setValue(this.selected.includes(value));
                toggle.onChange((checked) => {
                    if (checked) {
                        this.selected.push(value);
                    } else {
                        this.selected = this.selected.filter(
                            (v) => v !== value
                        );
                    }
                });
            });
        });

        new Setting(contentEl).addButton((btn) => {
            btn.setButtonText("Save")
                .setCta()
                .onClick(() => {
                    this.onSubmit(this.selected);
                    this.close();
                });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
