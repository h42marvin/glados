import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import React from 'react';
import Row from 'react-bootstrap/Row';
import {
    Coordinator, ModalStack, ScrollableSection, SidebarSection,
} from '../Common';
import { LogStructureGroupList } from '../LogStructure';
import { LogTopicList } from '../LogTopic';
import BackupSection from './BackupSection';
import ConsistencySection from './ConsistencySection';
import DetailsSection from './DetailsSection';
import Enum from '../../common/Enum';
import LayoutSection from './LayoutSection';
import LogEventSearch from './LogEventSearch';
import FavoriteTopicsSection from './FavoriteTopicsSection';
import { ReminderSidebar } from '../Reminders';


const [TabOptions, TabType, TabOptionsMap] = Enum([
    {
        label: 'Manage Events',
        value: 'log_events',
        Component: LogEventSearch,
    },
    {
        label: 'Manage Topics',
        value: 'log_topics',
        Component: LogTopicList,
        componentProps: { selector: { parent_topic_id: null, has_structure: false } },
    },
    {
        label: 'Manage Structures',
        value: 'log_structures',
        Component: LogStructureGroupList,
    },
]);

const [LayoutOptions, LayoutType] = Enum([
    {
        label: 'Default',
        value: 'default',
    },
    {
        label: 'Focus',
        value: 'focus',
    },
]);


class Applicaton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: TabType.LOG_EVENTS,
            activeLayout: LayoutType.DEFAULT,
            activeItem: null,
        };
        Coordinator.register('details', this.onDetailsChange.bind(this));
        Coordinator.register('layout-list', () => [LayoutOptions, this.state.activeLayout]);
        Coordinator.register('layout', (activeLayout) => this.setState({ activeLayout }));
    }

    onTabChange(tabType) {
        this.setState({ activeTab: tabType, activeLayout: LayoutType.DEFAULT });
    }

    onDetailsChange(item) {
        this.setState({ activeItem: item });
    }

    renderLeftSidebar() {
        return (
            <Col md={2} className="my-3">
                <ScrollableSection>
                    {TabOptions.map((option) => (
                        <SidebarSection
                            key={option.value}
                            onClick={() => this.onTabChange(option.value)}
                            selected={this.state.activeTab === option.value}
                        >
                            {option.label}
                        </SidebarSection>
                    ))}
                    <ReminderSidebar />
                </ScrollableSection>
            </Col>
        );
    }

    renderLayout() {
        const { Component, componentProps } = TabOptionsMap[this.state.activeTab];
        if (this.state.activeLayout === LayoutType.DEFAULT) {
            return (
                <>
                    <Col md={4} className="my-3">
                        <ScrollableSection>
                            <Component {...componentProps} />
                        </ScrollableSection>
                    </Col>
                    <Col md={4} className="my-3">
                        <ScrollableSection>
                            <DetailsSection item={this.state.activeItem} />
                        </ScrollableSection>
                    </Col>
                </>
            );
        } if (this.state.activeLayout === LayoutType.FOCUS) {
            return (
                <Col md={8} className="my-3">
                    <ScrollableSection>
                        <DetailsSection item={this.state.activeItem} />
                    </ScrollableSection>
                </Col>
            );
        }
        return <div>{`Unknown layout: ${this.state.activeLayout}`}</div>;
    }

    // eslint-disable-next-line class-methods-use-this
    renderRightSidebar() {
        return (
            <Col md={2} className="my-3">
                <LayoutSection />
                <BackupSection />
                <ConsistencySection />
                <FavoriteTopicsSection />
            </Col>
        );
    }

    render() {
        return (
            <Container fluid>
                <Row>
                    {this.renderLeftSidebar()}
                    {this.renderLayout()}
                    {this.renderRightSidebar()}
                </Row>
                <ModalStack />
            </Container>
        );
    }
}

export default Applicaton;
