import * as React from 'react'
import * as ReactUse from 'react-use'
import classnames from 'classnames'
import moment from 'moment'
import { observer } from 'mobx-react'
import { OpenInNewIcon, StarFullIcon, StarIcon, CloseIcon } from '../icon'

import useMobxStores from '../../hooks/use-mobx-stores'
import { TStore } from '../../store'

import "./index.scss"

type ViewerProps = {
}
const Viewer: React.FunctionComponent<ViewerProps> = observer(({}) => {
    // _id:      null,
    // _rev:     null,
    const { readerStore } = useMobxStores<TStore>()

    const handleBack = (): void => {
        window.history.replaceState(null, "wisdom reader", ' '); 
    }

    const handleAddFavoriteClick = async (): Promise<void> => {
        try {
            if (!readerStore.readingItem) {
                throw new Error("viewer is not ready")
            }

            await readerStore.toggleFavoriteItem(readerStore.readingItem.id);
            
        } catch (e) {
            // console.warn(`Unable to toggle favorite item: ${readerStore.readingItem && readerStore.readingItem.id} reason: ${e}`);
        }
    }

    const handleCloseClick = (): void => {
        readerStore.exitReading()
        window.history.replaceState(null, "wisdom reader", ' ');

        //Desktop: Remove fixed width (css: resize)
        // TODO: use reactive way
        (document.getElementsByClassName('App-List')[0] as any).style = null;
    }

    ReactUse.useMount(() => {
        window.addEventListener("popstate", handleBack);
    })

    ReactUse.useUnmount(() => {
        window.removeEventListener("popstate", handleBack);
    })

    if (!readerStore.readingItem) {
        return (
            <div>
                no viewer
                <button title="Add to favorite" onClick={handleAddFavoriteClick}></button>
            </div>
        )
    }
    return (
        <div className={classnames('App-Viewer', {active: 'active'})}>
            <div className="App-Viewer-Options">
                <button className="App-Viewer-Options-Close" onClick={handleCloseClick}><CloseIcon /></button>
                <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href={readerStore.readingItem.link}
                    onClick={handleCloseClick}>
                    <button title="Open to new tab"><OpenInNewIcon /></button>
                </a>
                <button title="Add to favorite" onClick={handleAddFavoriteClick}>
                    {readerStore.readingItem.favorite ? <StarFullIcon /> : <StarIcon /> }
                </button>
            </div>

            <div className="App-Viewer-Title">
                <h1><img alt="icon" src={readerStore.readingItem.icon} /> {readerStore.readingItem.title}</h1>
                <p>{moment(readerStore.readingItem.date).format("LLLL")}</p>
            </div>

            { /* TODO: find safer way.. */}
            <div className="App-Viewer-Content" dangerouslySetInnerHTML={{ __html: readerStore.readingItem.content }} />
        </div>
    )
})
export default Viewer