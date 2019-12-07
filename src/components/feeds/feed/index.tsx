import * as React from 'react'
import * as ReactUse from 'react-use'
import * as _ from 'lodash';
import PouchDB from 'pouchdb'
import Parser from 'rss-parser';
import moment from 'moment'
import { useDb } from '../../../contexts/db';
import { PROXY_PATH } from '../../../consts';

type FeedProps = {
    feed: {
        id: string;
        icon: string;
        title: string;
        uri: string;
        created: number;
        unread:  Array<any>;
    };
    onLoaded: (feed: {
        id: string;
        icon: string;
        title: string;
        uri: string;
        created: number;
        unread:  Array<any>;
    }) => void;
}

const Feed: React.FunctionComponent<FeedProps> = (props) => {
    const [loading, toggleLoading] = ReactUse.useToggle(false)
    const { dbFeedsItems } = useDb()
    if (!dbFeedsItems) {
        throw new Error("feeds_items not init")
    }

    ReactUse.useMount(async () => {
        const parser = new Parser();
        const uri = `${PROXY_PATH}${props.feed.uri}`;

        try {
            const feed = await parser.parseURL(uri);
            const newItems: Array<any> = [];

            if (!feed.items) {
                throw new Error("feed uri is invalid")
            }

            toggleLoading(false)
        } catch(e) {
            console.error(`Unable to fetch feed: ${uri} reason: ${e}`);
        }
    })
    
    return (
        <li title={props.feed.title}>
            <div className="n">{(loading) ? '...' : props.feed.unread.length}</div>
            <div className="i"><img src={props.feed.icon} alt="-" /></div>
            <div className="t">{(props.feed.title) ? props.feed.title.substring(0, 30) : ''}</div>
        </li>
    )
}
export default Feed