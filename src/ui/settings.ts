import FullCalendarPlugin from "../main";
import {
    App,
    Notice,
    PluginSettingTab,
    Setting,
    TFile,
    TFolder,
} from "obsidian";
import { CalendarInfo } from "../types";
import { CalendarSettings } from "./components/CalendarSetting";
import { AddCalendarSource } from "./components/AddCalendarSource";
import * as ReactDOM from "react-dom";
import { createElement } from "react";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import ReactModal from "./ReactModal";
import { importCalendars } from "src/calendars/parsing/caldav/import";
import { MultiSelectModal } from "./MultiSelectModal";

export interface FullCalendarSettings {
    calendarSources: CalendarInfo[];
    defaultCalendar: number;
    firstDay: number;
    initialView: {
        desktop: string;
        mobile: string;
    };
    availableViews: {
        desktop: string[];
        mobile: string[];
    };
    timeFormat24h: boolean;
    clickToCreateEventFromMonthView: boolean;
}

export const DEFAULT_SETTINGS: FullCalendarSettings = {
    calendarSources: [],
    defaultCalendar: 0,
    firstDay: 0,
    initialView: {
        desktop: "timeGridWeek",
        mobile: "timeGrid3Days",
    },
    availableViews: {
        desktop: ["timeGridDay", "timeGridWeek", "dayGridMonth", "listWeek"],
        mobile: ["timeGrid3Days", "timeGridDay", "listWeek"],
    },
    timeFormat24h: false,
    clickToCreateEventFromMonthView: true,
};

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const AVAILABLE_VIEWS: {
    desktop: Record<string, string>;
    mobile: Record<string, string>;
} = {
    desktop: {
        dayGridMonth: "Month",
        timeGridWeek: "Week",
        timeGridDay: "Day",
        listWeek: "List",
    },
    mobile: {
        dayGridMonth: "Month",
        timeGrid3Days: "3 Days",
        timeGridDay: "Day",
        listWeek: "List",
    },
};

const INITIAL_VIEW_OPTIONS = {
    DESKTOP: {
        timeGridDay: "Day",
        timeGridWeek: "Week",
        dayGridMonth: "Month",
        listWeek: "List",
    },
    MOBILE: {
        timeGrid3Days: "3 Days",
        timeGridDay: "Day",
        listWeek: "List",
    },
};

export function addCalendarButton(
    app: App,
    plugin: FullCalendarPlugin,
    containerEl: HTMLElement,
    submitCallback: (setting: CalendarInfo) => void,
    listUsedDirectories?: () => string[]
) {
    const directories = app.vault
        .getAllLoadedFiles()
        .filter((f) => f instanceof TFolder)
        .map((f) => f.path);

    new Setting(containerEl)
        .setName("Calendars")
        .setDesc("Add calendar")
        .addExtraButton((button) => {
            button.setTooltip("Add Calendar");
            button.setIcon("plus-with-circle");
            button.onClick(() => {
                let modal = new ReactModal(app, async () => {
                    await plugin.loadSettings();
                    const usedDirectories = (
                        listUsedDirectories
                            ? listUsedDirectories
                            : () =>
                                  plugin.settings.calendarSources
                                      .map(
                                          (s) =>
                                              s.type === "local" && s.directory
                                      )
                                      .filter((s): s is string => !!s)
                    )();
                    let headings: string[] = [];
                    let { template } = getDailyNoteSettings();

                    if (template) {
                        if (!template.endsWith(".md")) {
                            template += ".md";
                        }
                        const file = app.vault.getAbstractFileByPath(template);
                        if (file instanceof TFile) {
                            headings =
                                app.metadataCache
                                    .getFileCache(file)
                                    ?.headings?.map((h) => h.heading) || [];
                        }
                    }

                    return createElement(AddCalendarSource, {
                        directories: directories.filter(
                            (dir) => usedDirectories.indexOf(dir) === -1
                        ),
                        headings,
                        submit: async (sourceWithName: CalendarInfo) => {
                            if (!sourceWithName.name) {
                                sourceWithName.name = sourceWithName.type;
                            }
                            if (sourceWithName.type === "caldav") {
                                try {
                                    let sources = await importCalendars(
                                        {
                                            type: "basic",
                                            username: sourceWithName.username,
                                            password: sourceWithName.password,
                                        },
                                        sourceWithName.url
                                    );
                                    sources.forEach((source) =>
                                        submitCallback(source)
                                    );
                                } catch (e) {
                                    if (e instanceof Error) {
                                        new Notice(e.message);
                                    }
                                }
                            } else {
                                submitCallback(sourceWithName);
                            }
                            modal.close();
                        },
                    });
                });
                modal.open();
            });
        });
}

export class FullCalendarSettingTab extends PluginSettingTab {
    plugin: FullCalendarPlugin;

    constructor(app: App, plugin: FullCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Calendar Preferences" });

        // General Settings
        this.addGeneralSettings(containerEl);

        // View Settings
        this.addViewSettings(containerEl);

        // Manage Calendars
        this.addManageCalendars(containerEl);
    }

    addGeneralSettings(containerEl: HTMLElement) {
        containerEl.createEl("h3", { text: "General Settings" });

        new Setting(containerEl)
            .setName("Starting Day of the Week")
            .setDesc("Choose what day of the week to start.")
            .addDropdown((dropdown) => {
                WEEKDAYS.forEach((day, code) => {
                    dropdown.addOption(code.toString(), day);
                });
                dropdown.setValue(this.plugin.settings.firstDay.toString());
                dropdown.onChange(async (codeAsString) => {
                    this.plugin.settings.firstDay = Number(codeAsString);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("24-hour format")
            .setDesc("Display the time in a 24-hour format.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.timeFormat24h);
                toggle.onChange(async (value) => {
                    this.plugin.settings.timeFormat24h = value;
                    await this.plugin.saveSettings();
                });
            });
    }

    addViewSettings(containerEl: HTMLElement) {
        containerEl.createEl("h3", { text: "View Settings" });

        // Checkboxes for Desktop Views
        new Setting(containerEl)
            .setName("Desktop Views")
            .setDesc("Choose the views available on desktop devices.")
            .addButton((button) => {
                button.setButtonText("Edit Views");
                button.onClick(() => {
                    new MultiSelectModal({
                        app: this.app,
                        title: "Select Desktop Views",
                        options: AVAILABLE_VIEWS.desktop,
                        selected: this.plugin.settings.availableViews.desktop,
                        onSubmit: async (selectedViews: string[]) => {
                            if (selectedViews.length === 0) {
                                new Notice(
                                    "You must select at least one view."
                                );
                                return;
                            }
                            this.plugin.settings.availableViews.desktop =
                                selectedViews;
                            await this.plugin.saveSettings();
                            this.updateInitialViewDropdowns();
                        },
                    }).open();
                });
            });

        // Checkboxes for Mobile Views
        new Setting(containerEl)
            .setName("Mobile Views")
            .setDesc("Choose the views available on mobile devices.")
            .addButton((button) => {
                button.setButtonText("Edit Views");
                button.onClick(() => {
                    new MultiSelectModal({
                        app: this.app,
                        title: "Select Mobile Views",
                        options: AVAILABLE_VIEWS.mobile,
                        selected: this.plugin.settings.availableViews.mobile,
                        onSubmit: async (selectedViews: string[]) => {
                            if (selectedViews.length === 0) {
                                new Notice(
                                    "You must select at least one view."
                                );
                                return;
                            }
                            this.plugin.settings.availableViews.mobile =
                                selectedViews;
                            await this.plugin.saveSettings();
                            this.updateInitialViewDropdowns();
                        },
                    }).open();
                });
            });

        // Initial view settings
        containerEl.createEl("h3", { text: "Initial Views" });

        // Desktop Initial View
        new Setting(containerEl)
            .setName("Desktop Initial View")
            .setDesc("Choose the initial view range on desktop devices.")
            .addDropdown((dropdown) => {
                dropdown.selectEl.classList.add(
                    "desktop-initial-view-dropdown"
                );
                this.updateInitialViewDropdownOptions(
                    dropdown.selectEl,
                    this.plugin.settings.availableViews.desktop,
                    this.plugin.settings.initialView.desktop,
                    AVAILABLE_VIEWS.desktop
                );
                dropdown.onChange(async (initialView) => {
                    this.plugin.settings.initialView.desktop = initialView;
                    await this.plugin.saveSettings();
                });
            });

        // Mobile Initial View
        new Setting(containerEl)
            .setName("Mobile Initial View")
            .setDesc("Choose the initial view range on mobile devices.")
            .addDropdown((dropdown) => {
                dropdown.selectEl.classList.add("mobile-initial-view-dropdown");
                this.updateInitialViewDropdownOptions(
                    dropdown.selectEl,
                    this.plugin.settings.availableViews.mobile,
                    this.plugin.settings.initialView.mobile,
                    AVAILABLE_VIEWS.mobile
                );
                dropdown.onChange(async (initialView) => {
                    this.plugin.settings.initialView.mobile = initialView;
                    await this.plugin.saveSettings();
                });
            });
    }

    addManageCalendars(containerEl: HTMLElement) {
        containerEl.createEl("h3", { text: "Manage Calendars" });

        addCalendarButton(
            this.app,
            this.plugin,
            containerEl,
            async (source: CalendarInfo) => {
                sourceList.addSource(source);
            },
            () =>
                sourceList.state.sources
                    .map((s) => s.type === "local" && s.directory)
                    .filter((s): s is string => !!s)
        );

        const sourcesDiv = containerEl.createDiv();
        sourcesDiv.style.display = "block";
        let sourceList = ReactDOM.render(
            createElement(CalendarSettings, {
                sources: this.plugin.settings.calendarSources,
                submit: async (settings: CalendarInfo[]) => {
                    this.plugin.settings.calendarSources = settings;
                    await this.plugin.saveSettings();
                },
            }),
            sourcesDiv
        );
    }

    updateInitialViewDropdownOptions(
        dropdown: HTMLSelectElement,
        availableViews: string[],
        selectedView: string,
        viewOptions: Record<string, string>
    ) {
        dropdown.innerHTML = ""; // Clear existing options
        availableViews.forEach((view) => {
            const option = document.createElement("option");
            option.value = view;
            option.text = viewOptions[view];
            dropdown.add(option);
        });
        if (!availableViews.includes(selectedView)) {
            dropdown.value = availableViews[0];
            this.plugin.settings.initialView[
                dropdown.classList.contains("desktop-initial-view-dropdown")
                    ? "desktop"
                    : "mobile"
            ] = availableViews[0];
        } else {
            dropdown.value = selectedView;
        }
    }

    updateInitialViewDropdowns() {
        const desktopDropdown = document.querySelector<HTMLSelectElement>(
            ".desktop-initial-view-dropdown"
        );
        const mobileDropdown = document.querySelector<HTMLSelectElement>(
            ".mobile-initial-view-dropdown"
        );

        if (desktopDropdown) {
            this.updateInitialViewDropdownOptions(
                desktopDropdown,
                this.plugin.settings.availableViews.desktop,
                this.plugin.settings.initialView.desktop,
                AVAILABLE_VIEWS.desktop
            );
        }
        if (mobileDropdown) {
            this.updateInitialViewDropdownOptions(
                mobileDropdown,
                this.plugin.settings.availableViews.mobile,
                this.plugin.settings.initialView.mobile,
                AVAILABLE_VIEWS.mobile
            );
        }
    }
}
