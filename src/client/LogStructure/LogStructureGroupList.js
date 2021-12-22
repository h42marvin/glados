import React from 'react';
import PropTypes from 'prop-types';
import { BulletList } from '../Common';
import LogStructureList from './LogStructureList';
import LogStructureGroupEditor from './LogStructureGroupEditor';

function LogStructureGroupViewer(props) {
    const { logStructureGroup } = props;
    return (
        <div>{logStructureGroup.name}</div>
    );
}

LogStructureGroupViewer.propTypes = {
    logStructureGroup: PropTypes.Custom.LogStructureGroup.isRequired,
};

LogStructureGroupViewer.Expanded = (props) => {
    const { logStructureGroup, ...viewerComponentProps } = props;
    return (
        <LogStructureList
            where={{ logStructureGroup }}
            allowReordering
            viewerComponentProps={viewerComponentProps}
        />
    );
};

LogStructureGroupViewer.Expanded.propTypes = {
    logStructureGroup: PropTypes.Custom.LogStructureGroup.isRequired,
};

function LogStructureGroupList(props) {
    return (
        <BulletList
            {...props}
            name="Structures"
            dataType="log-structure-group"
            valueKey="logStructureGroup"
            ViewerComponent={LogStructureGroupViewer}
            EditorComponent={LogStructureGroupEditor}
            allowReordering
        />
    );
}

export default LogStructureGroupList;
