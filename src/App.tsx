import * as React from 'react';
import * as ReactUse from 'react-use'
import PouchDB from 'pouchdb';
import Feeds from './components/feeds';
import './App.scss';
import { DbProvider } from './contexts/db';
import List from './components/list';
import Viewer from './components/viewer';

const dbFeeds = new PouchDB<any>('pager_feeds')
const dbFeedsItems = new PouchDB('pager_feeds_items')

type Feed = {
    unread: Array<FeedsItem>;
}
type FeedsItem = {
    unread: boolean;
    feedId: string;
}

const App: React.FunctionComponent = () => {
    const [loading, toggleLoading] = ReactUse.useToggle(true)
    const [feeds, setFeeds] = React.useState<Array<Feed>>([])
    const [feedsItems, setFeedsItems] = React.useState<Array<FeedsItem>>([])
    const [viewer, setViewer] = React.useState(null)
  
  
    ReactUse.useMount(async () => {
    //Initialize persisted feeds items
        const persistedItems = await dbFeedsItems.allDocs<FeedsItem>({ include_docs: true })
        
        const unreadFeedsItems = persistedItems.rows.filter((item) => item.doc && item.doc.unread === true);
        const unreadFeedsItemsDocs = unreadFeedsItems.map(item => item.doc);

        //Initialize persisted feeds
        const persistedFeeds = await dbFeeds.allDocs<Feed>({ include_docs: true });
        const unreadFeeds = persistedFeeds.rows.map(feed => {
            const unReads = unreadFeedsItemsDocs.filter((item) => item && item.feedId === feed.id);
            feed.doc.unread = unReads.map(item => item && item._id);

            console.log(`Feed ${feed.id} has ${feed.doc.unread.length} unread.`);
            return feed.doc;
        });

        setFeeds(unreadFeeds)
        setFeedsItems(unreadFeedsItemsDocs as Array<FeedsItem>)
    })

    const handleOpenViewer = (item: any): void => {
        window.location.hash = "#viewer";
        setViewer(item);
    }
    
    const handleViewerBack = (): void => {
        return 
    }

    return (
        <div className="App">
            <DbProvider db={{dbFeeds, dbFeedsItems}}>
                <Feeds feeds={feeds} />
                <List items={feedsItems} openViewer={handleOpenViewer} />
                <Viewer viewer={viewer} onBack={handleViewerBack} />
            </DbProvider>
        </div>
    );
}

export default App;
