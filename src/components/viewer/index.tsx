import * as React from 'react'
import * as ReactUse from 'react-use'
import classnames from 'classnames'
import { OpenInNewIcon, StarFullIcon, StarIcon, CloseIcon } from '../icon'
import moment from 'moment'

import "./index.scss"
import { useDb } from '../../contexts/db'

type ViewerProps = {
    viewer: {
        id:    string;
        rev:   string;
        icon:     string;
        title:   string;
        date:     string;
        content:  string;
        link:     string;
        favorite: boolean;
    } | null;
    onBack: () => void;
}
const Viewer: React.FunctionComponent<ViewerProps> = ({ viewer, onBack }) => {
    // _id:      null,
    // _rev:     null,
    const [active, toggleActive] = ReactUse.useToggle(false) 
    const { dbFeedsItems } = useDb()
    if (!dbFeedsItems) {
        throw new Error("feeds_items not init")
    }

    // 如果没viewer则active为false
    React.useEffect(() => {
        if (!viewer) {
            if (active) {
                toggleActive(false)
            }
        } else {
            if (!active) {
                toggleActive(true)
            }
        }
    }, [viewer])

    const handleBack = (): void => {
        if (active) {
            toggleActive(false)
            window.history.replaceState(null, "wisdom reader", ' ');
            onBack()
        }  
    }

    const handleAddFavoriteClick = async (): Promise<void> => {
        try {
            if (!viewer) {
                throw new Error("viewer is not ready")
            }
            //Toggle favorite
            const item = await dbFeedsItems.get(viewer.id);
            item.favorite = !viewer.favorite;

            await dbFeedsItems.put(item);
            this.setState({ favorite: item.favorite });
        } catch (e) {
            console.warn(`Unable to toggle favorite item: ${this.state._id} reason: ${e}`);
        }
    }

    const handleCloseClick = (): void => {
        toggleActive(false)
        setContent(null)
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

    return (
        <div className={classnames('App-Viewer', {active: 'active'})}>
            <div className="App-Viewer-Options">
                <button className="App-Viewer-Options-Close" onClick={handleCloseClick}><CloseIcon /></button>
                <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href={link || ""}
                    onClick={handleCloseClick}>
                    <button title="Open to new tab"><OpenInNewIcon /></button>
                </a>
                <button title="Add to favorite" onClick={handleAddFavoriteClick}>
                    {favorite ? <StarFullIcon /> : <StarIcon /> }
                </button>
            </div>

            <div className="App-Viewer-Title">
                <h1><img alt="icon" src={icon || "#"} /> {title}</h1>
                <p>{date ? moment.unix(date).format("LLLL") : "---"}</p>
            </div>

            { /* TODO: find safer way.. */}
            <div className="App-Viewer-Content" dangerouslySetInnerHTML={{ __html: content || "" }} />
        </div>
    )
}
export default Viewer