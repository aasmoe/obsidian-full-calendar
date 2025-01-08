import React from "react";

type DailyNoteModalProps = {
    fileName: string;
    onCancel: () => void;
    onCreate: () => void;
};

const DailyNoteModal: React.FC<DailyNoteModalProps> = ({
    fileName,
    onCancel,
    onCreate,
}) => {
    return (
        <div>
            <h2>New Daily Note</h2>
            <p>
                File "{fileName}" does not exist. Would you like to create it?
            </p>
            <div>
                <button onClick={onCancel}>Never mind</button>
                <button className="mod-cta" onClick={onCreate}>
                    Create
                </button>
            </div>
        </div>
    );
};

export default DailyNoteModal;
