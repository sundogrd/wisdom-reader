/* eslint-disable @typescript-eslint/explicit-function-return-type */

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find'
import Parser from 'rss-parser';
import moment from 'moment';
import { PROXY_PATH } from '../consts';

PouchDB.plugin(PouchDBFind)

type FeedDoc = PouchDB.Core.Document<{
    uri: string;
    title: string;
    icon: string;
    createdAt: string;
}>
type ItemDoc = PouchDB.Core.Document<{
    favorite: boolean;
    content: string;
    date: string; // iso
    desc: string;
    feedUri: string;
    icon: string;
    link: string;
    title: string;
    unread:  boolean;
}>

const dbFeeds = new PouchDB<FeedDoc>('wisdom_reader_feeds')
const dbItems = new PouchDB<ItemDoc>('wisdom_reader_items')
export type Feed = {
    id: string; // pouchdb _id
    uri: string;
    title: string;
    icon: string;
    createdAt: string;
}

export type Item = {
    id: string; // pouchdb _id
    favorite: boolean;
    content: string;
    date: string; // iso
    desc: string;
    feedUri: string;
    icon: string;
    link: string;
    title: string;
    unread:  boolean;
}


function packItem (itemDoc: ItemDoc): Item {
    return {
        id: itemDoc._id,
        favorite: itemDoc.favorite,
        content: itemDoc.content,
        date: itemDoc.date,
        desc: itemDoc.desc,
        feedUri: itemDoc.feedUri,
        icon: itemDoc.icon,
        link: itemDoc.link,
        title: itemDoc.title,
        unread: itemDoc.unread,
    }
}

function packFeed (feedDoc: FeedDoc): Feed {
    return {
        id: feedDoc._id,
        uri: feedDoc.uri,
        title: feedDoc.title,
        icon: feedDoc.icon,
        createdAt: feedDoc.createdAt,
    }
}

const readerStore = () => ({
    feedsLastUpdate: '1995-11-28T00:00:00.000Z',
    readingItem: null as null | Item,
    feeds: [] as Array<Feed>,
    favoriteItems: [] as Array<Item>,
    items: [] as Array<Item>,
    inited: false,
    async init(): Promise<void> {
        const persistedItems = await dbItems.allDocs<Item>({ include_docs: true })
        const persistedFeeds = await dbFeeds.allDocs<Feed>({ include_docs: true });

        this.items = persistedItems.rows.filter((itemRow) => itemRow.doc).map((itemRow) => {
            if (!itemRow.doc) {
                throw new Error("impossible itemRow no 'doc' property")
            }
            return packItem(itemRow.doc)
        })

        this.feeds = persistedFeeds.rows.filter((itemRow) => itemRow.doc).map((feedRow) => {
            if (!feedRow.doc) {
                throw new Error("impossible itemRow no 'doc' property")
            }
            
            return packFeed(feedRow.doc)
        })
        this.inited = true
    },
    async createFeed(createFeedRequest: {
        uri: string;
        title: string;
        icon: string;
    }): Promise<void> {
        const feedDoc: FeedDoc = {
            _id: createFeedRequest.uri,
            uri: createFeedRequest.uri,
            icon: createFeedRequest.icon,
            title: createFeedRequest.title,
            createdAt: new Date().toISOString()
        }
        const putRes = await dbFeeds.put(feedDoc)
        if (putRes.ok) {
            const createdDoc = await dbFeeds.get(createFeedRequest.uri)
            this.feeds.push(packFeed(createdDoc))
            this.refreshFeed(createdDoc.uri)
        }
    },
    async createItem(createItemRequest: {
        content: string;
        date: string; // iso
        desc: string;
        feedUri: string;
        icon: string;
        link: string;
        title: string;
    }): Promise<void> {
        // TODO: 生成id
        const itemDoc: ItemDoc = {
            _id: createItemRequest.link,
            favorite: false,
            content: createItemRequest.content,
            date: createItemRequest.date,
            desc: createItemRequest.desc,
            feedUri: createItemRequest.feedUri,
            icon: createItemRequest.icon,
            link: createItemRequest.link,
            title: createItemRequest.title,
            unread: false,
        }
        const putRes = await dbItems.put(itemDoc)
        if (putRes.ok) {
            const createdDoc = await dbItems.get(createItemRequest.link)
            this.items.push(packItem(createdDoc))
        }
    },
    async toggleFavoriteItem(itemId: string): Promise<void> {
        const itemDoc = await dbItems.get(itemId)
        itemDoc.favorite = !itemDoc.favorite
        const putRes = await dbItems.put(itemDoc)

        if (putRes.ok) {
            this.favoriteItems.push(packItem(itemDoc))
            if (this.readingItem && this.readingItem.id === itemId) {
                this.readingItem.favorite = !itemDoc.favorite
            }
        }
    },
    async getItem(id: string): Promise<Item | undefined> {
        try {
            const itemDoc = await dbItems.get(id)
            return packItem(itemDoc)
        } catch (err) {
            return undefined
        }
    },
    async markItemsAsRead(ids: Array<string>): Promise<void> {
        const findRes = await dbItems.find({
            selector: {_id: {$in: ids}}
        })
        await dbItems.bulkDocs(findRes.docs.map((doc) => {
            return {
                ...doc,
                unread: false,
            }
        }))
        this.items.filter((item) => ids.indexOf(item.id) !== -1).forEach(item => {
            item.unread = false
        })
        // TODO: 检测异常情况
    },
    read(item: Item): void {
        this.readingItem = item
        this.markItemsAsRead([item.id])
    },
    exitReading(): void {
        this.readingItem = null
    },
    async refreshFeeds(): Promise<void> {
        await Promise.all(this.feeds.map(async (feed) => {
            return await this.refreshFeed(feed.uri)
        }))
        this.feedsLastUpdate = moment().toISOString()
        return
    },
    // 加载feed最新内容
    async refreshFeed(feedUri: string): Promise<void> {
        // TODO: 如果 uri 不在 database 内报错
        const feedDoc = await dbFeeds.get(feedUri)

        const parser = new Parser();
        const uri = `${PROXY_PATH}${feedDoc.uri}`;

        try {
            const feed     = await parser.parseURL(uri);
            const newItemDocs: Array<ItemDoc> = [];

            // TODO: 去重
            const nowFeedItemsRes = await dbItems.find({
                selector: {feedUri: feedDoc.uri}
            })
            const nowFeedItemDocs = nowFeedItemsRes.docs

            if (!feed.items) {
                throw new Error("There is no item in feed")
            }

            feed.items.forEach(item => {
                const date = item.isoDate || ((item.pubDate) ? moment(item.pubDate.replace(/CET|CEST/gi, '')) : moment());
                const ts   = moment(date)
                
                //Add only new items since feed was imported
                if (ts >= moment(feedDoc.createdAt).add(-7, "day")) {
                    if (!item.link) {
                        // console.error("item no link", item)
                        return
                    }
                    // 去重
                    const dbSameLinkItem = nowFeedItemDocs.find((searchElement) => searchElement.link === item.link)
                    if (!dbSameLinkItem) {
                        newItemDocs.push({
                            _id: "",
                            feedUri:   feedDoc.uri,
                            icon:     feedDoc.icon,
                            title:    item.title || "unknown",
                            desc:     item.contentSnippet || "",
                            content:  item["content:encoded"] || item.content,
                            date:     ts.toISOString(),
                            link:     item.link || "#",
                            unread:   true,
                            favorite: false,
                        });
                    } else {
                        // console.debug("redundant item")
                    }
                }
            });

            //Try to add new document
            //If document already exist, pouchDB will fail with conflict
            let result = await dbItems.bulkDocs(newItemDocs);
            //Keep only successful new insertion
            result = result.filter(item => !(item as PouchDB.Core.Error).error && (item as PouchDB.Core.Response).ok);
            const newIds = result.map((resultItem) => resultItem.id)
            const findRes = await dbItems.find({
                selector: {_id: {$in: newIds}}
            })
            const newItems = findRes.docs.map((doc) => packItem(doc))
            this.items = [...newItems, ...this.items]
        } catch(e) {
            // console.error(`Unable to fetch feed: ${uri} reason: ${e}`);
        }
    }
});


export default readerStore;
