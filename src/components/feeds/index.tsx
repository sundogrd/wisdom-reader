import * as React from 'react'
import * as ReactUse from 'react-use'
import Parser from 'rss-parser'
import classnames from 'classnames'
import moment from 'moment'
import { observer } from 'mobx-react'
import { CloseIcon } from '../icon'
import { PROXY_PATH, FAVICON_PROVIDER } from '../../consts'
import useMobxStores from '../../hooks/use-mobx-stores'
import { TStore } from '../../store'
import Feed from './feed'

import "./index.scss"

type FeedsProps = {
}
const Feeds: React.FunctionComponent<FeedsProps> = observer(({}) => {
    const [loading, toggleLoading] = ReactUse.useToggle(true)
    const [rss, setRss] = React.useState("")

    const { readerStore, appStore } = useMobxStores<TStore>()

    const handleAppForeground = () => {
        //Trigger automatic update on app foreground
        //Update only if lastupdate < 1 minute
        //User can still force update with pull-to-refresh
        if (moment(readerStore.feedsLastUpdate).add(1, 'minute') <= moment()) {
            console.log("start refreshFeeds")
            readerStore.refreshFeeds()
        }
    }

    // 监听visible时刷新
    ReactUse.useMount(() => {
        document.addEventListener("visibilitychange", handleAppForeground);
    })

    ReactUse.useUnmount(() => {
        document.removeEventListener("visibilitychange", handleAppForeground)
    })

    ReactUse.useMount(async () => {
        toggleLoading(true)
        await readerStore.refreshFeeds()
        toggleLoading(false)
    })

    const handleAddFeedClick = async () => {
        // Test feed validity
        if (rss === "") {
            alert("Please add rss feed link first.");
            return;
        }

        if (!/^(http|https):\/\//.test(rss)) {
            alert("Missing http/https scheme.");
            return;
        }

        // Loader
        toggleLoading(true)

        const feed = {
            uri:     rss,
            title:   rss,
            icon:    '',
        };

        //Trying to fetch xml feed
        try {
            const parser = new Parser();
            const uri = `${PROXY_PATH}${rss}`;

            const info = await parser.parseURL(uri);
            if (info.title) {
                //Add feed title
                feed.title = info.title;
            }

            //Use google as favicon provider :)
            if (window.fetch) {
                const base = info.link || rss;
                const icon = await fetch(`${PROXY_PATH}${FAVICON_PROVIDER}${base}`);
                await icon.arrayBuffer().then((buffer) => {
                    //Read stream
                    let binary     = '';
                    const bytes      = [].slice.call(new Uint8Array(buffer));
                    bytes.forEach((b) => binary += String.fromCharCode(b));
                    const imageStr   = window.btoa(binary);

                    //Save icon as base64
                    feed.icon = `data:image/png;base64,${imageStr}`;
                });
            }
        } catch (e) {
            toggleLoading(false)
            console.error(`Unable to add feed: ${rss} reason: ${e}`);
            return;
        }

        try {
            await readerStore.createFeed({
                uri: feed.uri,
                title: feed.title,
                icon: feed.icon,
            })
            toggleLoading(false)
            setRss('')

            // this.setState({
            //     loading: false,
            //     rss:     '',
            //     feeds:   [...this.state.feeds, ...[feed]]
            // });
        } catch(e) {
            toggleLoading(false)
            console.error(`Unable to add feed: ${rss} reason: ${e}`);
        }
    }


    const handleFeedsToggleClick = () => {
        appStore.toggleHideFeeds()
    }
    const handleFeedsInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRss(e.target.value)
    }
    return (
        <div className="app-feeds-container">
            { /* Loader */}
            <div className="App-Feeds-Loader">
                { loading && <div className="loader"></div> }
            </div>

            { /* Onboarding if empty feeds */}
            {/* { (feeds.length === 0 && !loading) && <UserAlert triggerOK={this.addDefaultFeed} /> } */}

            { /* Manage feeds */}
            <div className={classnames("App-Feeds", { 'hide': appStore.hideFeeds })}>
                <h1>
                    <img alt="pager" src={process.env.PUBLIC_URL + '/favicon.ico'} />
                    <button className="App-Feeds-Toggle" onClick={handleFeedsToggleClick}>
                        <CloseIcon />
                    </button>
                </h1>

                { /* Http link */ }
                <input
                    className="App-Feeds-Input"
                    type="text"
                    value={rss}
                    onChange={handleFeedsInputChange}
                    placeholder="Add rss feed link here.."
                />

                {loading ? (
                    <button
                        disabled
                        className="App-Feeds-Add">
							LOADING...
                    </button>
                ) : (
                    <button
                        className="App-Feeds-Add"
                        onClick={handleAddFeedClick}>
							ADD (+)
                    </button>
                )}

                <ul>
                    {readerStore.feeds.map((feed) => (
                        <Feed
                            key={feed.id}
                            feed={feed}
                        />
                    ))}
                </ul>
            </div>
        </div>
    )
})
export default Feeds