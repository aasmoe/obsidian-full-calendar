import * as React from "react";
import { useState } from "react";
import { CalendarInfo } from "../../types";

// Define a type for creating change listeners
type ChangeListener = <T extends Partial<CalendarInfo>>(
    fromString: (val: string) => T
) => React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;

// Define a type for a subset of CalendarInfo
type SourceWith<T extends Partial<CalendarInfo>, K> = T extends K ? T : never;

// DirectorySelect component props
interface DirectorySelectProps<T extends Partial<CalendarInfo>> {
    source: T;
    changeListener: ChangeListener;
    directories: string[];
}

// DirectorySelect component
function DirectorySelect<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
    directories,
}: DirectorySelectProps<T>) {
    const dirOptions = [...directories];
    dirOptions.sort();

    let sourceWithDirectory = source as SourceWith<T, { directory: undefined }>;
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Directory</div>
                <div className="setting-item-description">
                    Directory to store events
                </div>
            </div>
            <div className="setting-item-control">
                <select
                    required
                    value={sourceWithDirectory.directory || ""}
                    onChange={changeListener((x) => ({
                        ...sourceWithDirectory,
                        directory: x,
                    }))}
                >
                    <option value="" disabled hidden>
                        Choose a directory
                    </option>
                    {dirOptions.map((o, idx) => (
                        <option key={idx} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// Basic props for components that need a change listener and a source
interface BasicProps<T extends Partial<CalendarInfo>> {
    source: T;
    changeListener: ChangeListener;
}

// ColorPicker component
function ColorPicker<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
}: BasicProps<T>) {
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Color</div>
                <div className="setting-item-description">
                    The color of events on the calendar
                </div>
            </div>
            <div className="setting-item-control">
                <input
                    required
                    type="color"
                    value={source.color}
                    style={{ maxWidth: "25%", minWidth: "3rem" }}
                    onChange={changeListener((x) => ({ ...source, color: x }))}
                />
            </div>
        </div>
    );
}

// UrlInput component
function UrlInput<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
}: BasicProps<T>) {
    let sourceWithUrl = source as SourceWith<T, { url: undefined }>;
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Url</div>
                <div className="setting-item-description">
                    Url of the server
                </div>
            </div>
            <div className="setting-item-control">
                <input
                    required
                    type="text"
                    value={sourceWithUrl.url || ""}
                    onChange={changeListener((x) => ({
                        ...sourceWithUrl,
                        url: x,
                    }))}
                />
            </div>
        </div>
    );
}

// UsernameInput component
function UsernameInput<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
}: BasicProps<T>) {
    let sourceWithUsername = source as SourceWith<T, { username: undefined }>;
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Username</div>
                <div className="setting-item-description">
                    Username for the account
                </div>
            </div>
            <div className="setting-item-control">
                <input
                    required
                    type="text"
                    value={sourceWithUsername.username || ""}
                    onChange={changeListener((x) => ({
                        ...sourceWithUsername,
                        username: x,
                    }))}
                />
            </div>
        </div>
    );
}

// HeadingInput component
function HeadingInput<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
    headings,
}: BasicProps<T> & { headings: string[] }) {
    let sourceWithHeading = source as SourceWith<T, { heading: undefined }>;
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Heading</div>
                <div className="setting-item-description">
                    Heading to store events under in the daily note.
                </div>
            </div>
            <div className="setting-item-control">
                {headings.length > 0 ? (
                    <select
                        required
                        value={sourceWithHeading.heading || ""}
                        onChange={changeListener((x) => ({
                            ...sourceWithHeading,
                            heading: x,
                        }))}
                    >
                        <option value="" disabled hidden>
                            Choose a heading
                        </option>
                        {headings.map((o, idx) => (
                            <option key={idx} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        required
                        type="text"
                        value={sourceWithHeading.heading || ""}
                        onChange={changeListener((x) => ({
                            ...sourceWithHeading,
                            heading: x,
                        }))}
                    />
                )}
            </div>
        </div>
    );
}

// PasswordInput component
function PasswordInput<T extends Partial<CalendarInfo>>({
    source,
    changeListener,
}: BasicProps<T>) {
    let sourceWithPassword = source as SourceWith<T, { password: undefined }>;
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">Password</div>
                <div className="setting-item-description">
                    Password for the account
                </div>
            </div>
            <div className="setting-item-control">
                <input
                    required
                    type="password"
                    value={sourceWithPassword.password || ""}
                    onChange={changeListener((x) => ({
                        ...sourceWithPassword,
                        password: x,
                    }))}
                />
            </div>
        </div>
    );
}

// AddCalendarSource component props
interface AddCalendarProps {
    directories: string[];
    headings: string[];
    submit: (setting: CalendarInfo) => Promise<void>;
}

// AddCalendarSource component
export const AddCalendarSource = ({
    directories,
    headings,
    submit,
}: AddCalendarProps) => {
    // Initialize state with default values
    const defaultSource: Partial<CalendarInfo> = {
        type: "local",
        name: "New Calendar",
        color: "#ffffff", // Example default color
    };

    // Use defaultSource to initialize component state
    const [setting, setSettingState] =
        useState<Partial<CalendarInfo>>(defaultSource);
    const [calendarType, setCalendarType] = useState<CalendarInfo["type"]>(
        setting.type || "local"
    );
    const [calendarName, setCalendarName] = useState(
        setting.name || calendarType
    );
    const [submitting, setSubmitingState] = useState(false);
    const [submitText, setSubmitText] = useState(
        calendarType === "caldav" ? "Import Calendars" : "Add Calendar"
    );

    // Utility function for handling input changes
    const makeChangeListener = <T extends Partial<CalendarInfo>>(
        fromString: (val: string) => T
    ): React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> => {
        return (e) => {
            const value = e.target.value;
            const updatedObject = fromString(value);
            setSettingState((prev) => ({
                ...prev,
                ...updatedObject,
            }));
        };
    };

    // Update state when calendar type changes
    const handleTypeChange = (newType: string) => {
        const validType = newType as CalendarInfo["type"];
        setCalendarType(validType);
        const updatedSource = { type: validType }; // New mapping if needed
        setSettingState((prev) => ({ ...prev, ...updatedSource }));
        setCalendarName((prev) => prev || validType); // Preserve existing name or set based on type
        setSubmitText(
            validType === "caldav" ? "Import Calendars" : "Add Calendar"
        );
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!submitting) {
            setSubmitingState(true);
            setSubmitText(
                calendarType === "caldav"
                    ? "Importing Calendars"
                    : "Adding Calendar"
            );
            await submit({ ...setting, name: calendarName } as CalendarInfo);
        }
    };

    return (
        <div className="vertical-tab-content">
            <form onSubmit={handleSubmit}>
                {/* Calendar Type Dropdown */}
                <div className="setting-item">
                    <div className="setting-item-info">
                        <div className="setting-item-name">Calendar Type</div>
                        <div className="setting-item-description">
                            Select the type of calendar to add
                        </div>
                    </div>
                    <div className="setting-item-control">
                        <select
                            value={calendarType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            <option value="local">Full note</option>
                            <option value="dailynote">Daily Note</option>
                            <option value="ical">Remote (.ics format)</option>
                            <option value="caldav">CalDAV</option>
                        </select>
                    </div>
                </div>

                {/* Calendar Name Input */}
                <div className="setting-item">
                    <div className="setting-item-info">
                        <div className="setting-item-name">Calendar Name</div>
                        <div className="setting-item-description">
                            Provide a name for the calendar
                        </div>
                    </div>
                    <div className="setting-item-control">
                        <input
                            type="text"
                            value={calendarName}
                            onChange={(e) => setCalendarName(e.target.value)}
                            placeholder="Calendar Name"
                        />
                    </div>
                </div>

                {/* Conditional inputs based on calendar type */}
                {(calendarType === "ical" || calendarType === "caldav") && (
                    <UrlInput
                        source={setting}
                        changeListener={makeChangeListener}
                    />
                )}
                {calendarType === "caldav" && (
                    <>
                        <UsernameInput
                            source={setting}
                            changeListener={makeChangeListener}
                        />
                        <PasswordInput
                            source={setting}
                            changeListener={makeChangeListener}
                        />
                    </>
                )}
                {calendarType === "local" && (
                    <DirectorySelect
                        source={setting}
                        changeListener={makeChangeListener}
                        directories={directories}
                    />
                )}
                {calendarType === "dailynote" && (
                    <HeadingInput
                        source={setting}
                        changeListener={makeChangeListener}
                        headings={headings}
                    />
                )}
                {calendarType !== "caldav" && (
                    <ColorPicker
                        source={setting}
                        changeListener={makeChangeListener}
                    />
                )}

                {/* Submit button */}
                <div className="setting-item">
                    <div className="setting-item-info" />
                    <div className="setting-control">
                        <button
                            className="mod-cta"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitText}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
