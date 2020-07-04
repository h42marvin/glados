import React from 'react';
import { DataLoader } from '../Common';

class LogTopicSidebar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { logTopics: null };
    }

    componentDidMount() {
        this.dataLoader = new DataLoader({
            name: 'log-topic-list',
            args: {
                selector: { on_sidebar: true },
                ordering: true,
            },
            callback: (logTopics) => this.setState({ logTopics }),
        });
    }

    componentWillUnmount() {
        this.dataLoader.stop();
    }

    render() {
        if (this.state.logTopics === null) {
            return 'Loading ...';
        }
        return (
            <div>
                <div className="log-viewer">
                    <span>Favorite Topics</span>
                </div>
                {this.state.logTopics.map((logTopic) => (
                    <div key={logTopic.id}>
                        {logTopic.name}
                    </div>
                ))}
            </div>
        );
    }
}

export default LogTopicSidebar;
