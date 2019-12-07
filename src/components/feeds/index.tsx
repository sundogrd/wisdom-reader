import * as React from 'react'
import * as ReactUse from 'react-use'
import UserAlert from '../user-alert'
import { CloseIcon } from '../icon'
import Parser from 'rss-parser'
import classnames from 'classnames'
import { PROXY_PATH, FAVICON_PROVIDER } from '../../consts'
import { useDb } from '../../contexts/db'
import Feed from './feed'

import "./index.scss"

type FeedsProps = {
    feeds: any[];
}
const Feeds: React.FunctionComponent<FeedsProps> = ({ feeds }) => {
    const [loading, toggleLoading] = ReactUse.useToggle(true)
    const [loaded, setLoaded] = React.useState(0)
    const [rss, setRss] = React.useState("")
    const { dbFeeds } = useDb()
    if (!dbFeeds) {
        throw new Error("db_feeds not init")
    }

    const [hide, toggleHide] = ReactUse.useToggle(true)

    const addFeed = async (link: string, fromOPML = false): Promise<void> => {
        const rss = link;

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
            _id:     rss,
            uri:     rss,
            title:   rss,
            icon:    '',
            created: (fromOPML) ? Math.floor(Date.now() / 100) : 0
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

            //Use google as favicon provider (o_O)
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
            await dbFeeds.put(feed);
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

    const onFeedLoad = () => {
        // Counting feed load
        setLoaded(loaded + 1)
        if (loaded === feeds.length) {
            toggleLoading()
        }
    }

    const handleFeedsToggleClick = () => {
        toggleHide()
    }
    const handleFeedsInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRss(e.target.value)
    }
    const handleOpmlFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (!e.target.files || e.target.files.length === 0) return;

        const fileReader = new FileReader();
        fileReader.onloadend = (): void => {
            if(fileReader.result === "" || fileReader.result === null) return;
            if (typeof fileReader.result !== "string") {
                return
            }
            if(fileReader.result.startsWith('<?xml') === false) {
                alert("Please upload a valid opml file.");
                return;
            }

            //1- Extract all xmlUrl
            const urls = fileReader.result.match(/xmlUrl="(.*?)"/g);
            if (!urls) {
                throw new Error("fileReader result invalid")
            }

            //2- Add feed
            urls.forEach((feed, i) => {
                feed = feed.replace('xmlUrl="', '').slice(0, -1);
                setTimeout(() => {
                    addFeed(feed, true);
                }, i * 100);
            });
        }

        fileReader.readAsText(e.target.files[0]);
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
            <div className={classnames("App-Feeds", hide)}>
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
                    placeholder="| Add rss feed link here.."
                />

                { /* OPML */ }
                <label
                    className="App-Feeds-Input-OPML"
                    htmlFor="opml-file-trigger">
						OPML
                </label>
                <input
                    id="opml-file-trigger"
                    type="file"
                    onChange={handleOpmlFileChange}
                    style={{display:'none'}}
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
                        onClick={() => addFeed(rss)}>
							ADD (+)
                    </button>
                )}

                <ul>
                    {feeds.map((feed) => (
                        <Feed
                            key={feed._id}
                            feed={feed}
                            onLoaded={onFeedLoad}
                        />
                    ))}
                </ul>
            </div>
        </div>
    )
}
export default Feeds