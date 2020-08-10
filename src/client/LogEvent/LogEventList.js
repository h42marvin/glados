import React from 'react';
import PropTypes from 'prop-types';
import { BulletList, LeftRight, TextEditor } from '../Common';

import LogEventAdder from './LogEventAdder';
import LogEventEditor from './LogEventEditor';


function LogEventViewer(props) {
    return (
        <LeftRight>
            <TextEditor
                unstyled
                disabled
                value={props.logEvent.title}
            />
            {props.displayLogLevel && props.logEvent.logLevel === 2 ? '(major)' : null}
        </LeftRight>
    );
}

LogEventViewer.propTypes = {
    logEvent: PropTypes.Custom.LogEvent.isRequired,
    displayLogLevel: PropTypes.bool,
};

LogEventViewer.Expanded = (props) => {
    const { logEvent } = props;
    if (!logEvent.details) {
        return null;
    }
    return (
        <TextEditor
            unstyled
            disabled
            value={logEvent.details}
        />
    );
};

LogEventViewer.Expanded.propTypes = {
    logEvent: PropTypes.Custom.LogEvent.isRequired,
};

function LogEventList(props) {
    const { showAdder, ...moreProps } = props;
    return (
        <BulletList
            {...moreProps}
            dataType="log-event"
            valueKey="logEvent"
            allowSubscription
            ViewerComponent={LogEventViewer}
            EditorComponent={LogEventEditor}
            AdderComponent={showAdder ? LogEventAdder : null}
        />
    );
}

LogEventList.propTypes = {
    name: PropTypes.string.isRequired,
    showAdder: PropTypes.bool.isRequired,
};

LogEventList.Single = (props) => (
    <BulletList.Item
        dataType="log-event"
        value={props.logEvent}
        valueKey="logEvent"
        ViewerComponent={LogEventViewer}
        EditorComponent={LogEventEditor}
    />
);

LogEventList.Single.propTypes = {
    logEvent: PropTypes.Custom.LogEvent.isRequired,
};

export default LogEventList;
