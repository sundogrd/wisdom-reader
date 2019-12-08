import * as React from 'react'
import * as ReactUse from 'react-use';
import { Feed as FeedData } from '../../../store/reader-store';
import useMobxStores from '../../../hooks/use-mobx-stores';
import { TStore } from '../../../store';

type FeedProps = {
    feed: FeedData;
    onLoaded?: (feed: FeedData) => void;
}

const Feed: React.FunctionComponent<FeedProps> = (props) => {
    const { readerStore } = useMobxStores<TStore>()
    
    ReactUse.useLogger("Feed", props.feed)

    const handleItemClick = (): void => {
        // refresh
        readerStore.refreshFeed(props.feed.uri)
    }

    return (
        <li title={props.feed.title} onClick={handleItemClick}>
            {/* <div className="n">{(loading) ? '...' : props.feed.unread.length}</div> */}
            <div className="i"><img src={props.feed.icon} alt="-" /></div>
            <div className="t">{(props.feed.title) ? props.feed.title.substring(0, 30) : ''}</div>
        </li>
    )
}
export default Feed